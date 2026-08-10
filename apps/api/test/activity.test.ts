import { describe, expect, it } from "vitest";
import request from "supertest";
import app from "../src/app";
import prisma from "../src/config/prisma";
import {
  createActivity,
  createActivityRubric,
  createCourse,
  createLinkAttachment,
  createScoreWeight,
  createStudent,
  createSubmission,
  createTeacher,
  createUser,
  enrolStudent,
} from "./factories";
import { sessionCookie } from "./helpers/session";
import { listStoredObjects } from "./helpers/storage";

/**
 * Graded work — /activity.
 *
 * An activity is what a teacher sets and a student hands in for. Writing one is
 * a teacher's job and guarded; reading one is not, because the student's own
 * assignment page goes through the same GET endpoints.
 *
 * Two things about the write endpoints are worth knowing before reading the
 * cases. They are multipart, because an activity can carry files, so every
 * field arrives as a string and the controller parses it by hand. And creating
 * an activity does more than insert one row: it writes the activity's own
 * rubric, and it opens a `student_activity` row for every student enrolled in
 * the section, which is what makes the work appear on their page at all.
 */

const PDF = Buffer.from("%PDF-1.4 example\n");

/** Uploads from this route all land under one prefix, shared by every case in
 *  the file, so a case that cares takes the difference itself. */
const ACTIVITY_PREFIX = "activity/";

/** The smallest rubric the create endpoint accepts: one criterion worth all of
 *  the score, with two levels to pick between. */
const RUBRIC = [
  {
    criteria: "ความถูกต้อง",
    weight: 100,
    levels: [
      { level_no: 1, description: "ยังไม่ถูกต้อง" },
      { level_no: 2, description: "ถูกต้องครบถ้วน" },
    ],
  },
];

/**
 * An activity whose one criterion has already been marked for one student —
 * the state that makes an edit dangerous, and what the PUT cases below are
 * about (#25).
 *
 * The criterion is given the same shape as `RUBRIC`, so sending `RUBRIC` back
 * with its id is the edit form saying "this criterion is the one you gave me,
 * unchanged".
 *
 * `save` is that form being submitted, with everything but the rubric left as
 * it was — which is what each of the cases below varies.
 */
async function markedActivity(teacher_id: string, section_id: number) {
  const activity = await createActivity({ section_id });
  const rubric = await createActivityRubric({
    activity_id: activity.id,
    criteria: RUBRIC[0].criteria,
    weight: RUBRIC[0].weight,
    levels: RUBRIC[0].levels,
  });
  const levels = await prisma.rubric_levels.findMany({
    where: { rubric_id: rubric.id },
    orderBy: { level_no: "asc" },
  });
  const submission = await createSubmission({
    activity_id: activity.id,
    status: "GRADED",
    score: 8,
  });
  const mark = await prisma.student_activity_rubric_score.create({
    data: {
      student_activity_id: submission.id,
      rubric_activity_mapping_id: rubric.id,
      rubric_level_id: levels[levels.length - 1].id,
      calculated_score: 8,
    },
  });

  const save = (rubric: unknown) =>
    request(app)
      .put("/activity")
      .set("Cookie", sessionCookie({ userId: teacher_id }))
      .field("activity_id", String(activity.id))
      .field("section_id", String(section_id))
      .field("activity_name", activity.activity_name)
      .field("activity_type", "INDIVIDUAL")
      .field("rubric", JSON.stringify(rubric));

  return { activity, rubric, levels, submission, mark, save };
}

describe("POST /activity", () => {
  it("rejects a request with no session", async () => {
    const response = await request(app).post("/activity");

    expect(response.status).toBe(401);
    expect(response.body).toEqual({
      success: false,
      message: "ไม่พบ Token หรือ Token หมดอายุ",
    });
  });

  it("rejects a signed-in user who is not a teacher", async () => {
    const user = await createUser();
    const course = await createCourse();

    const response = await request(app)
      .post("/activity")
      .set("Cookie", sessionCookie({ userId: user.user_id }))
      .field("section_id", String(course.section_id))
      .field("activity_name", "รายงานบทที่ 1")
      .field("activity_type", "INDIVIDUAL")
      .field("rubric", JSON.stringify(RUBRIC));

    expect(response.status).toBe(403);
    expect(response.body).toEqual({
      success: false,
      message: "สิทธิ์การเข้าถึงเฉพาะอาจารย์เท่านั้น",
    });
    expect(
      await prisma.activities.count({ where: { section_id: course.section_id } }),
    ).toBe(0);
  });

  it("stores nothing in the bucket when the caller is refused", async () => {
    // multer runs to completion before the next middleware is called, so with
    // the role check registered after it a refused request had already had its
    // file read into memory. See BEHAVIOR-CHANGES.md.
    const user = await createUser();
    const course = await createCourse();
    const before = await listStoredObjects(ACTIVITY_PREFIX);

    const response = await request(app)
      .post("/activity")
      .set("Cookie", sessionCookie({ userId: user.user_id }))
      .field("section_id", String(course.section_id))
      .field("activity_name", "รายงานบทที่ 1")
      .field("activity_type", "INDIVIDUAL")
      .field("rubric", JSON.stringify(RUBRIC))
      .attach("files", PDF, "brief.pdf");

    expect(response.status).toBe(403);
    expect(await listStoredObjects(ACTIVITY_PREFIX)).toEqual(before);
  });

  it("creates the activity, its rubric, and a row for every student enrolled", async () => {
    const teacher = await createTeacher();
    const course = await createCourse({ teacher_id: teacher.user_id });
    const enrolled = await createStudent();
    const elsewhere = await createStudent();
    await enrolStudent(course.section_id, enrolled.student_id);
    const weight = await createScoreWeight({ section_id: course.section_id });

    const response = await request(app)
      .post("/activity")
      .set("Cookie", sessionCookie({ userId: teacher.user_id }))
      .field("section_id", String(course.section_id))
      .field("activity_name", "รายงานบทที่ 1")
      // Sent upper case by the frontend, stored lower case.
      .field("activity_type", "INDIVIDUAL")
      .field("score_number", "20")
      .field("score_ratio_id", String(weight.score_ratio_id))
      .field("is_average_score", "false")
      .field("is_self_assessment", "true")
      .field("expected_level", "3")
      .field("detail", JSON.stringify({ instruction: "ส่งเป็นไฟล์ PDF" }))
      .field("rubric", JSON.stringify(RUBRIC));

    expect(response.status).toBe(200);

    const activity = await prisma.activities.findUniqueOrThrow({
      where: { id: response.body.data.id },
      include: { rubric_activity_mapping: { include: { rubric_levels: true } } },
    });
    expect(activity).toMatchObject({
      section_id: course.section_id,
      activity_name: "รายงานบทที่ 1",
      activity_type: "individual",
      score_number: 20,
      score_ratio_id: weight.score_ratio_id,
      is_average_score: false,
      is_self_assessment: true,
      expected_level: 3,
      detail: { instruction: "ส่งเป็นไฟล์ PDF" },
    });

    expect(activity.rubric_activity_mapping).toHaveLength(1);
    expect(activity.rubric_activity_mapping[0]).toMatchObject({
      criteria: "ความถูกต้อง",
      weight: 100,
    });
    expect(
      activity.rubric_activity_mapping[0].rubric_levels.map(
        (level) => level.level_no,
      ),
    ).toEqual([1, 2]);

    // The work is now on the enrolled student's page, and nobody else's.
    const rows = await prisma.student_activity.findMany({
      where: { activity_id: activity.id },
    });
    expect(rows).toHaveLength(1);
    expect(rows[0]).toMatchObject({
      student_id: enrolled.student_id,
      status: "NOT_SUBMITTED",
      score: null,
    });
    expect(rows[0].student_id).not.toBe(elsewhere.student_id);
  });

  it("uploads an attached brief and hangs it off the activity", async () => {
    const teacher = await createTeacher();
    const course = await createCourse({ teacher_id: teacher.user_id });

    const response = await request(app)
      .post("/activity")
      .set("Cookie", sessionCookie({ userId: teacher.user_id }))
      .field("section_id", String(course.section_id))
      .field("activity_name", "รายงานบทที่ 2")
      .field("activity_type", "INDIVIDUAL")
      .field("rubric", JSON.stringify(RUBRIC))
      .field(
        "urls",
        JSON.stringify([
          { title: "ตัวอย่างรายงาน", url: "https://example.test/sample" },
        ]),
      )
      .attach("files", PDF, "brief.pdf");

    expect(response.status).toBe(200);

    const attached = await prisma.activity_attachments.findMany({
      where: { activity_id: response.body.data.id },
      include: { attachments: true },
    });
    expect(attached).toHaveLength(2);

    const file = attached.find(
      (row) => row.attachments.attachment_type === "file",
    );
    const link = attached.find(
      (row) => row.attachments.attachment_type === "link",
    );
    expect(file?.attachments).toMatchObject({
      title: "brief.pdf",
      original_filename: "brief.pdf",
      file_size: BigInt(PDF.length),
      file_type: "PDF",
    });
    expect(link?.attachments).toMatchObject({
      title: "ตัวอย่างรายงาน",
      url: "https://example.test/sample",
    });
    expect(await listStoredObjects(ACTIVITY_PREFIX)).toContain(
      file?.attachments.file_path,
    );
  });

  it("answers 400 when the request carries no rubric", async () => {
    // The controller ran JSON.parse over the field without checking it was
    // there, so a missing rubric was a 500 quoting a syntax error.
    const teacher = await createTeacher();
    const course = await createCourse({ teacher_id: teacher.user_id });

    const response = await request(app)
      .post("/activity")
      .set("Cookie", sessionCookie({ userId: teacher.user_id }))
      .field("section_id", String(course.section_id))
      .field("activity_name", "รายงานที่ไม่มีเกณฑ์")
      .field("activity_type", "INDIVIDUAL");

    expect(response.status).toBe(400);
    expect(response.body).toEqual({
      success: false,
      message: "ข้อมูลที่ส่งมาไม่ถูกต้อง: rubric ต้องระบุ",
      errors: [{ field: "rubric", location: "body", message: "ต้องระบุ" }],
    });
    expect(
      await prisma.activities.count({
        where: { activity_name: "รายงานที่ไม่มีเกณฑ์" },
      }),
    ).toBe(0);
  });

  it("answers 400 for a kind of work it does not have", async () => {
    // activity_type is a plain VarChar, and the read endpoints hand back
    // whatever is in it as though it were one of the two the frontend knows.
    const teacher = await createTeacher();
    const course = await createCourse({ teacher_id: teacher.user_id });

    const response = await request(app)
      .post("/activity")
      .set("Cookie", sessionCookie({ userId: teacher.user_id }))
      .field("section_id", String(course.section_id))
      .field("activity_name", "รายงานประเภทประหลาด")
      .field("activity_type", "PAIR")
      .field("rubric", JSON.stringify(RUBRIC));

    expect(response.status).toBe(400);
    expect(response.body.errors).toEqual([
      {
        field: "activity_type",
        location: "body",
        message: "ต้องเป็นค่าใดค่าหนึ่งใน: INDIVIDUAL, GROUP",
      },
    ]);
    expect(
      await prisma.activities.count({
        where: { activity_name: "รายงานประเภทประหลาด" },
      }),
    ).toBe(0);
  });

  it("answers 400 for a rubric that is not JSON, and uploads nothing", async () => {
    const teacher = await createTeacher();
    const course = await createCourse({ teacher_id: teacher.user_id });
    const before = await listStoredObjects(ACTIVITY_PREFIX);

    const response = await request(app)
      .post("/activity")
      .set("Cookie", sessionCookie({ userId: teacher.user_id }))
      .field("section_id", String(course.section_id))
      .field("activity_name", "รายงานเกณฑ์พัง")
      .field("activity_type", "INDIVIDUAL")
      .field("rubric", "ไม่ใช่ JSON")
      .attach("files", PDF, "brief.pdf");

    expect(response.status).toBe(400);
    expect(response.body.errors).toEqual([
      { field: "rubric", location: "body", message: "ต้องเป็นรายการ" },
    ]);
    expect(await listStoredObjects(ACTIVITY_PREFIX)).toEqual(before);
  });
});

describe("PUT /activity", () => {
  it("rejects a request with no session", async () => {
    const activity = await createActivity();

    const response = await request(app)
      .put("/activity")
      .field("activity_id", String(activity.id))
      .field("activity_name", "ชื่อใหม่")
      .field("activity_type", "INDIVIDUAL")
      .field("rubric", JSON.stringify(RUBRIC));

    expect(response.status).toBe(401);
    expect(
      (await prisma.activities.findUniqueOrThrow({ where: { id: activity.id } }))
        .activity_name,
    ).toBe(activity.activity_name);
  });

  it("rejects a signed-in user who is not a teacher", async () => {
    const user = await createUser();
    const activity = await createActivity();

    const response = await request(app)
      .put("/activity")
      .set("Cookie", sessionCookie({ userId: user.user_id }))
      .field("activity_id", String(activity.id))
      .field("activity_name", "ชื่อใหม่")
      .field("activity_type", "INDIVIDUAL")
      .field("rubric", JSON.stringify(RUBRIC));

    expect(response.status).toBe(403);
    expect(
      (await prisma.activities.findUniqueOrThrow({ where: { id: activity.id } }))
        .activity_name,
    ).toBe(activity.activity_name);
  });

  it("updates the activity and replaces its rubric", async () => {
    const teacher = await createTeacher();
    const course = await createCourse({ teacher_id: teacher.user_id });
    const activity = await createActivity({
      section_id: course.section_id,
      activity_name: "รายงานบทที่ 1",
      score_number: 10,
    });
    const oldRubric = await createActivityRubric({
      activity_id: activity.id,
      criteria: "เกณฑ์เดิม",
    });

    const response = await request(app)
      .put("/activity")
      .set("Cookie", sessionCookie({ userId: teacher.user_id }))
      .field("activity_id", String(activity.id))
      .field("section_id", String(course.section_id))
      .field("activity_name", "รายงานบทที่ 1 (แก้ไข)")
      .field("activity_type", "GROUP")
      .field("score_number", "30")
      .field("rubric", JSON.stringify(RUBRIC));

    expect(response.status).toBe(200);

    const updated = await prisma.activities.findUniqueOrThrow({
      where: { id: activity.id },
      include: { rubric_activity_mapping: { include: { rubric_levels: true } } },
    });
    expect(updated).toMatchObject({
      activity_name: "รายงานบทที่ 1 (แก้ไข)",
      activity_type: "group",
      score_number: 30,
    });

    // A criterion sent without an id is a new one, so the old criterion is not
    // among those the teacher kept: it goes, and its levels with it.
    expect(updated.rubric_activity_mapping).toHaveLength(1);
    expect(updated.rubric_activity_mapping[0].criteria).toBe("ความถูกต้อง");
    expect(updated.rubric_activity_mapping[0].id).not.toBe(oldRubric.id);
    expect(
      await prisma.rubric_levels.count({ where: { rubric_id: oldRubric.id } }),
    ).toBe(0);
  });

  it("keeps the marks already given when the rubric comes back untouched", async () => {
    // The point of #25. The rubric used to be deleted and written again on
    // every save, and student_activity_rubric_score cascades off it — so moving
    // a deadline, long after the work was marked, silently deleted every mark.
    // A criterion that comes back with the id it was given is the one already
    // there, and is updated in place.
    const teacher = await createTeacher();
    const course = await createCourse({ teacher_id: teacher.user_id });
    const { activity, rubric, levels, submission, mark, save } =
      await markedActivity(teacher.user_id, course.section_id);

    const response = await save([{ id: rubric.id, ...RUBRIC[0] }]).field(
      "deadline_date",
      "2026-12-31T00:00:00.000Z",
    );

    expect(response.status).toBe(200);
    expect(
      (await prisma.activities.findUniqueOrThrow({ where: { id: activity.id } }))
        .deadline_date,
    ).toEqual(new Date("2026-12-31T00:00:00.000Z"));

    // Same criterion, same levels, same mark — ids and all, because grading
    // writes the mark against the id of the criterion and of the level.
    expect(
      await prisma.rubric_activity_mapping.findMany({
        where: { activity_id: activity.id },
        select: { id: true },
      }),
    ).toEqual([{ id: rubric.id }]);
    expect(
      await prisma.rubric_levels.findMany({
        where: { rubric_id: rubric.id },
        orderBy: { level_no: "asc" },
        select: { id: true },
      }),
    ).toEqual(levels.map((level) => ({ id: level.id })));
    expect(
      await prisma.student_activity_rubric_score.findUniqueOrThrow({
        where: { id: mark.id },
      }),
    ).toMatchObject({
      student_activity_id: submission.id,
      rubric_activity_mapping_id: rubric.id,
      rubric_level_id: levels[levels.length - 1].id,
    });
  });

  it("rewrites a kept criterion in place, wording and weight alike", async () => {
    const teacher = await createTeacher();
    const course = await createCourse({ teacher_id: teacher.user_id });
    const { rubric, levels, mark, save } = await markedActivity(
      teacher.user_id,
      course.section_id,
    );

    const response = await save([
      {
        id: rubric.id,
        criteria: "ความถูกต้องของผลลัพธ์",
        weight: 80,
        levels: [
          { level_no: 1, description: "ยังไม่ถูกต้อง" },
          { level_no: 2, description: "ถูกต้องทุกกรณีทดสอบ" },
        ],
      },
    ]);

    expect(response.status).toBe(200);
    expect(
      await prisma.rubric_activity_mapping.findUniqueOrThrow({
        where: { id: rubric.id },
      }),
    ).toMatchObject({ criteria: "ความถูกต้องของผลลัพธ์", weight: 80 });
    expect(
      await prisma.rubric_levels.findUniqueOrThrow({
        where: { id: levels[1].id },
      }),
    ).toMatchObject({ level_no: 2, description: "ถูกต้องทุกกรณีทดสอบ" });
    expect(
      await prisma.student_activity_rubric_score.count({
        where: { id: mark.id },
      }),
    ).toBe(1);
  });

  it("adds a criterion without disturbing the one already marked", async () => {
    const teacher = await createTeacher();
    const course = await createCourse({ teacher_id: teacher.user_id });
    const { activity, rubric, mark, save } = await markedActivity(
      teacher.user_id,
      course.section_id,
    );

    const response = await save([
      { id: rubric.id, ...RUBRIC[0] },
      {
        criteria: "ความสะอาดของโค้ด",
        weight: 40,
        levels: [
          { level_no: 1, description: "อ่านยาก" },
          { level_no: 2, description: "อ่านง่าย" },
        ],
      },
    ]);

    expect(response.status).toBe(200);

    const criteria = await prisma.rubric_activity_mapping.findMany({
      where: { activity_id: activity.id },
      orderBy: { id: "asc" },
      include: { rubric_levels: true },
    });
    expect(criteria).toHaveLength(2);
    expect(criteria[0].id).toBe(rubric.id);
    expect(criteria[1].criteria).toBe("ความสะอาดของโค้ด");
    expect(criteria[1].rubric_levels).toHaveLength(2);
    expect(
      await prisma.student_activity_rubric_score.count({
        where: { id: mark.id },
      }),
    ).toBe(1);
  });

  it("drops the marks of a criterion the teacher deleted, and only those", async () => {
    const teacher = await createTeacher();
    const course = await createCourse({ teacher_id: teacher.user_id });
    const { activity, rubric, submission, mark, save } = await markedActivity(
      teacher.user_id,
      course.section_id,
    );
    const dropped = await createActivityRubric({
      activity_id: activity.id,
      criteria: "ความสะอาดของโค้ด",
      levels: RUBRIC[0].levels,
    });
    const droppedLevel = await prisma.rubric_levels.findFirstOrThrow({
      where: { rubric_id: dropped.id },
    });
    const droppedMark = await prisma.student_activity_rubric_score.create({
      data: {
        student_activity_id: submission.id,
        rubric_activity_mapping_id: dropped.id,
        rubric_level_id: droppedLevel.id,
        calculated_score: 4,
      },
    });

    const response = await save([{ id: rubric.id, ...RUBRIC[0] }]);

    expect(response.status).toBe(200);
    expect(
      await prisma.rubric_activity_mapping.findMany({
        where: { activity_id: activity.id },
        select: { id: true },
      }),
    ).toEqual([{ id: rubric.id }]);

    // A criterion nobody is marked against any more takes its marks with it —
    // that much of the old cascade is what deleting a criterion means.
    expect(
      await prisma.student_activity_rubric_score.count({
        where: { id: droppedMark.id },
      }),
    ).toBe(0);
    expect(
      await prisma.student_activity_rubric_score.count({
        where: { id: mark.id },
      }),
    ).toBe(1);
  });

  it("drops a mark given at a level the teacher deleted", async () => {
    // The level the student was marked at is gone, so the mark has nothing left
    // to mean. The criterion stays, and so do the marks given at the levels the
    // teacher kept.
    const teacher = await createTeacher();
    const course = await createCourse({ teacher_id: teacher.user_id });
    const { rubric, levels, mark, save } = await markedActivity(
      teacher.user_id,
      course.section_id,
    );

    const response = await save([
      {
        id: rubric.id,
        criteria: RUBRIC[0].criteria,
        weight: RUBRIC[0].weight,
        levels: [{ level_no: 1, description: "ยังไม่ถูกต้อง" }],
      },
    ]);

    expect(response.status).toBe(200);
    expect(
      await prisma.rubric_levels.findMany({
        where: { rubric_id: rubric.id },
        select: { id: true },
      }),
    ).toEqual([{ id: levels[0].id }]);
    expect(
      await prisma.student_activity_rubric_score.count({
        where: { id: mark.id },
      }),
    ).toBe(0);
  });

  it("pins: a mark stays on its level_no when the form renumbers the levels", async () => {
    // Levels are matched on level_no, and level_no is a position rather than an
    // identity: deleting a column in the edit form renumbers the ones under it.
    // So a mark keeps the number it was given while the wording on that number
    // moves down a level, and the mark comes to say something the teacher never
    // said. Pinned, not fixed — the form has no level ids to send back, and
    // giving it some changes what GET /activity returns.
    const teacher = await createTeacher();
    const course = await createCourse({ teacher_id: teacher.user_id });
    const activity = await createActivity({ section_id: course.section_id });
    const criterion = await createActivityRubric({
      activity_id: activity.id,
      criteria: RUBRIC[0].criteria,
      weight: RUBRIC[0].weight,
      levels: [
        { level_no: 1, description: "ยังไม่ถูกต้อง" },
        { level_no: 2, description: "ถูกต้องบางส่วน" },
        { level_no: 3, description: "ถูกต้องครบถ้วน" },
      ],
    });
    const levels = await prisma.rubric_levels.findMany({
      where: { rubric_id: criterion.id },
      orderBy: { level_no: "asc" },
    });
    const submission = await createSubmission({
      activity_id: activity.id,
      status: "GRADED",
      score: 5,
    });
    const mark = await prisma.student_activity_rubric_score.create({
      data: {
        student_activity_id: submission.id,
        rubric_activity_mapping_id: criterion.id,
        rubric_level_id: levels[1].id,
        calculated_score: 5,
      },
    });

    // The teacher deletes the middle column of three. The form renumbers what
    // is left, so the top level comes back as level 2 — the number the mark
    // sits on.
    const response = await request(app)
      .put("/activity")
      .set("Cookie", sessionCookie({ userId: teacher.user_id }))
      .field("activity_id", String(activity.id))
      .field("section_id", String(course.section_id))
      .field("activity_name", activity.activity_name)
      .field("activity_type", "INDIVIDUAL")
      .field(
        "rubric",
        JSON.stringify([
          {
            id: criterion.id,
            criteria: RUBRIC[0].criteria,
            weight: RUBRIC[0].weight,
            levels: [
              { level_no: 1, description: "ยังไม่ถูกต้อง" },
              { level_no: 2, description: "ถูกต้องครบถ้วน" },
            ],
          },
        ]),
      );

    expect(response.status).toBe(200);
    expect(
      await prisma.student_activity_rubric_score.count({
        where: { id: mark.id },
      }),
    ).toBe(1);
    expect(
      await prisma.rubric_levels.findUniqueOrThrow({
        where: { id: levels[1].id },
      }),
    ).toMatchObject({ level_no: 2, description: "ถูกต้องครบถ้วน" });
  });

  it("answers 400 for the same criterion sent twice", async () => {
    // Both entries would be written onto the one row, last one winning, and the
    // teacher would come away with one criterion fewer than the form showed
    // them — with nothing to say so.
    const teacher = await createTeacher();
    const course = await createCourse({ teacher_id: teacher.user_id });
    const { rubric, mark, save } = await markedActivity(
      teacher.user_id,
      course.section_id,
    );

    const response = await save([
      { id: rubric.id, ...RUBRIC[0] },
      {
        id: rubric.id,
        criteria: "ความสะอาดของโค้ด",
        weight: 100,
        levels: RUBRIC[0].levels,
      },
    ]);

    expect(response.status).toBe(400);
    expect(response.body).toEqual({
      success: false,
      message: "มีเกณฑ์เดียวกันถูกส่งมาซ้ำ",
    });
    expect(
      await prisma.rubric_activity_mapping.findUniqueOrThrow({
        where: { id: rubric.id },
      }),
    ).toMatchObject({ criteria: RUBRIC[0].criteria });
    expect(
      await prisma.student_activity_rubric_score.count({
        where: { id: mark.id },
      }),
    ).toBe(1);
  });

  it("answers 400 for a criterion that belongs to another activity", async () => {
    // An id is all the endpoint has to go on, and it says nothing about which
    // activity it came from. Writing to it unchecked would let one activity's
    // save rewrite another's rubric.
    const teacher = await createTeacher();
    const course = await createCourse({ teacher_id: teacher.user_id });
    const activity = await createActivity({
      section_id: course.section_id,
      activity_name: "ชื่อเดิม",
    });
    const elsewhere = await createActivityRubric({ criteria: "ของกิจกรรมอื่น" });
    const before = await listStoredObjects(ACTIVITY_PREFIX);

    const response = await request(app)
      .put("/activity")
      .set("Cookie", sessionCookie({ userId: teacher.user_id }))
      .field("activity_id", String(activity.id))
      .field("section_id", String(course.section_id))
      .field("activity_name", "ชื่อใหม่")
      .field("activity_type", "INDIVIDUAL")
      .field("rubric", JSON.stringify([{ id: elsewhere.id, ...RUBRIC[0] }]))
      .attach("files", PDF, "brief.pdf");

    expect(response.status).toBe(400);
    expect(response.body).toEqual({
      success: false,
      message: "มีเกณฑ์บางรายการที่ไม่ใช่ของกิจกรรมนี้",
    });

    // Refused before anything is written, uploads included: those do not go
    // through the transaction, so a file put away here would stay put away.
    expect(await listStoredObjects(ACTIVITY_PREFIX)).toEqual(before);
    expect(
      (await prisma.activities.findUniqueOrThrow({ where: { id: activity.id } }))
        .activity_name,
    ).toBe("ชื่อเดิม");
    expect(
      await prisma.rubric_activity_mapping.findUniqueOrThrow({
        where: { id: elsewhere.id },
      }),
    ).toMatchObject({
      activity_id: elsewhere.activity_id,
      criteria: "ของกิจกรรมอื่น",
    });
  });

  it("deletes the attachments remove_attachment_ids names", async () => {
    const teacher = await createTeacher();
    const course = await createCourse({ teacher_id: teacher.user_id });
    const doomed = await createLinkAttachment();
    const kept = await createLinkAttachment();
    const activity = await createActivity({
      section_id: course.section_id,
      attachment_ids: [doomed.attachment_id, kept.attachment_id],
    });

    const response = await request(app)
      .put("/activity")
      .set("Cookie", sessionCookie({ userId: teacher.user_id }))
      .field("activity_id", String(activity.id))
      .field("section_id", String(course.section_id))
      .field("activity_name", "ชื่อใหม่")
      .field("activity_type", "INDIVIDUAL")
      .field("rubric", JSON.stringify(RUBRIC))
      .field("remove_attachment_ids", JSON.stringify([doomed.attachment_id]));

    expect(response.status).toBe(200);
    expect(
      await prisma.activity_attachments.findMany({
        where: { activity_id: activity.id },
        select: { attachment_id: true },
      }),
    ).toEqual([{ attachment_id: kept.attachment_id }]);

    // Nothing else pointed at the removed one, so it goes with the link (#34).
    expect(
      await prisma.attachments.findUnique({
        where: { attachment_id: doomed.attachment_id },
      }),
    ).toBeNull();
    expect(
      await prisma.attachments.findUnique({
        where: { attachment_id: kept.attachment_id },
      }),
    ).not.toBeNull();
  });

  it("removes only its own attachment, whatever ids the request names", async () => {
    // See BEHAVIOR-CHANGES.md. The delete used to match on attachment id
    // alone, so naming another activity's attachment unlinked it there — and
    // once #34 put the sweep behind that delete, it would have destroyed the
    // file as well.
    const teacher = await createTeacher();
    const course = await createCourse({ teacher_id: teacher.user_id });
    const stranger = await createLinkAttachment();
    const other = await createActivity({
      section_id: course.section_id,
      attachment_ids: [stranger.attachment_id],
    });
    const activity = await createActivity({ section_id: course.section_id });

    const response = await request(app)
      .put("/activity")
      .set("Cookie", sessionCookie({ userId: teacher.user_id }))
      .field("activity_id", String(activity.id))
      .field("section_id", String(course.section_id))
      .field("activity_name", "ชื่อใหม่")
      .field("activity_type", "INDIVIDUAL")
      .field("rubric", JSON.stringify(RUBRIC))
      .field("remove_attachment_ids", JSON.stringify([stranger.attachment_id]));

    expect(response.status).toBe(200);
    expect(
      await prisma.activity_attachments.findMany({
        where: { activity_id: other.id },
        select: { attachment_id: true },
      }),
    ).toEqual([{ attachment_id: stranger.attachment_id }]);
    expect(
      await prisma.attachments.findUnique({
        where: { attachment_id: stranger.attachment_id },
      }),
    ).not.toBeNull();
  });

  it("fails for an activity that does not exist", async () => {
    const teacher = await createTeacher();
    const course = await createCourse({ teacher_id: teacher.user_id });

    const response = await request(app)
      .put("/activity")
      .set("Cookie", sessionCookie({ userId: teacher.user_id }))
      .field("activity_id", "999999")
      .field("section_id", String(course.section_id))
      .field("activity_name", "ไม่มีอยู่จริง")
      .field("activity_type", "INDIVIDUAL")
      .field("rubric", JSON.stringify(RUBRIC));

    expect(response.status).toBe(500);
  });

  it("answers 400 when no activity is named", async () => {
    const teacher = await createTeacher();
    const course = await createCourse({ teacher_id: teacher.user_id });
    const activity = await createActivity({
      section_id: course.section_id,
      activity_name: "ชื่อเดิม",
    });

    const response = await request(app)
      .put("/activity")
      .set("Cookie", sessionCookie({ userId: teacher.user_id }))
      .field("section_id", String(course.section_id))
      .field("activity_name", "ชื่อใหม่")
      .field("activity_type", "INDIVIDUAL")
      .field("rubric", JSON.stringify(RUBRIC));

    expect(response.status).toBe(400);
    expect(response.body.errors).toEqual([
      { field: "activity_id", location: "body", message: "ต้องระบุ" },
    ]);
    expect(
      (
        await prisma.activities.findUniqueOrThrow({
          where: { id: activity.id },
        })
      ).activity_name,
    ).toBe("ชื่อเดิม");
  });
});

describe("DELETE /activity", () => {
  it("rejects a request with no session", async () => {
    const activity = await createActivity();

    const response = await request(app)
      .delete("/activity")
      .query({ activity_id: activity.id });

    expect(response.status).toBe(401);
    expect(
      await prisma.activities.findUnique({ where: { id: activity.id } }),
    ).not.toBeNull();
  });

  it("rejects a signed-in user who is not a teacher", async () => {
    const user = await createUser();
    const activity = await createActivity();

    const response = await request(app)
      .delete("/activity")
      .query({ activity_id: activity.id })
      .set("Cookie", sessionCookie({ userId: user.user_id }));

    expect(response.status).toBe(403);
    expect(
      await prisma.activities.findUnique({ where: { id: activity.id } }),
    ).not.toBeNull();
  });

  it("deletes the activity and everything hanging off it", async () => {
    const teacher = await createTeacher();
    const handedOut = await createLinkAttachment();
    const handedIn = await createLinkAttachment();
    const activity = await createActivity({
      attachment_ids: [handedOut.attachment_id],
    });
    const rubric = await createActivityRubric({ activity_id: activity.id });
    const submission = await createSubmission({
      activity_id: activity.id,
      attachment_ids: [handedIn.attachment_id],
    });
    const survivor = await createActivity();

    const response = await request(app)
      .delete("/activity")
      .query({ activity_id: activity.id })
      .set("Cookie", sessionCookie({ userId: teacher.user_id }));

    expect(response.status).toBe(200);
    expect(
      await prisma.activities.findUnique({ where: { id: activity.id } }),
    ).toBeNull();
    // Cascades, all the way down: the rubric, its levels, and the students'
    // rows go with it.
    expect(
      await prisma.rubric_activity_mapping.findUnique({
        where: { id: rubric.id },
      }),
    ).toBeNull();
    expect(
      await prisma.rubric_levels.count({ where: { rubric_id: rubric.id } }),
    ).toBe(0);
    expect(
      await prisma.student_activity.findUnique({ where: { id: submission.id } }),
    ).toBeNull();

    // Both sides of the work lose their last owner in the same cascade — what
    // the teacher handed out and what the student handed in — so the
    // attachments go with it rather than being left unreachable (#34).
    expect(
      await prisma.attachments.findMany({
        where: {
          attachment_id: {
            in: [handedOut.attachment_id, handedIn.attachment_id],
          },
        },
      }),
    ).toEqual([]);
    expect(
      await prisma.activities.findUnique({ where: { id: survivor.id } }),
    ).not.toBeNull();
  });

  it("fails for an activity that does not exist", async () => {
    const teacher = await createTeacher();

    const response = await request(app)
      .delete("/activity")
      .query({ activity_id: 999_999 })
      .set("Cookie", sessionCookie({ userId: teacher.user_id }));

    expect(response.status).toBe(500);
  });

  it("answers 400 when no activity is named, and deletes nothing", async () => {
    const teacher = await createTeacher();
    const activity = await createActivity();

    const response = await request(app)
      .delete("/activity")
      .set("Cookie", sessionCookie({ userId: teacher.user_id }));

    expect(response.status).toBe(400);
    expect(response.body.errors).toEqual([
      { field: "activity_id", location: "query", message: "ต้องระบุ" },
    ]);
    expect(
      await prisma.activities.findUnique({ where: { id: activity.id } }),
    ).not.toBeNull();
  });
});

describe("GET /activity", () => {
  it("returns the activity with its rubric and attachments", async () => {
    const activity = await createActivity({ activity_name: "รายงานบทที่ 1" });
    const rubric = await createActivityRubric({
      activity_id: activity.id,
      criteria: "ความถูกต้อง",
    });

    // No cookie: the student's assignment page reads this.
    const response = await request(app)
      .get("/activity")
      .query({ activity_id: activity.id });

    expect(response.status).toBe(200);
    expect(response.body.data).toMatchObject({
      id: activity.id,
      activity_id: activity.id,
      activity_name: "รายงานบทที่ 1",
      // Stored lower case, handed back upper case.
      activity_type: "INDIVIDUAL",
      attachments: { file: [], url: [] },
    });
    expect(response.body.data.rubric_activity_mapping).toHaveLength(1);
    expect(response.body.data.rubric_activity_mapping[0]).toMatchObject({
      id: rubric.id,
      criteria: "ความถูกต้อง",
    });
    expect(
      response.body.data.rubric_activity_mapping[0].rubric_levels,
    ).toHaveLength(4);
  });

  it("answers with no data for an activity that does not exist", async () => {
    // The service returns undefined and the controller passes it straight on,
    // so the caller gets a 200 with nothing in it rather than a 404.
    const response = await request(app)
      .get("/activity")
      .query({ activity_id: 999_999 });

    expect(response.status).toBe(200);
    expect(response.body).toEqual({
      success: true,
      message: "get activity successfully",
    });
  });

  it("answers 400 when activity_id is missing", async () => {
    // parseInt(undefined) is NaN, which used to reach Prisma as null on a
    // column that cannot be null.
    const response = await request(app).get("/activity");

    expect(response.status).toBe(400);
    expect(response.body).toEqual({
      success: false,
      message: "ข้อมูลที่ส่งมาไม่ถูกต้อง: activity_id ต้องระบุ",
      errors: [
        { field: "activity_id", location: "query", message: "ต้องระบุ" },
      ],
    });
  });
});

describe("GET /activity/list", () => {
  it("lists the section's activities with how far along marking is", async () => {
    const course = await createCourse();
    const weight = await createScoreWeight({
      section_id: course.section_id,
      score_category: "งานที่มอบหมาย",
    });
    const activity = await createActivity({
      section_id: course.section_id,
      activity_name: "รายงานบทที่ 1",
    });
    await prisma.activities.update({
      where: { id: activity.id },
      data: { score_ratio_id: weight.score_ratio_id },
    });
    await createSubmission({ activity_id: activity.id, status: "SUBMITTED" });
    await createSubmission({ activity_id: activity.id, status: "GRADED" });
    await createSubmission({
      activity_id: activity.id,
      status: "NOT_SUBMITTED",
    });

    const response = await request(app)
      .get("/activity/list")
      .query({ section_id: course.section_id });

    expect(response.status).toBe(200);
    expect(response.body.data).toHaveLength(1);
    expect(response.body.data[0]).toMatchObject({
      id: activity.id,
      activity_name: "รายงานบทที่ 1",
      activity_type: "INDIVIDUAL",
      student_count: 3,
      // Anything that is not NOT_SUBMITTED counts as handed in; only SUBMITTED
      // and GRADING are still waiting for a mark.
      submitted_count: 2,
      pending_grading_count: 1,
      subject_score_ratio: expect.objectContaining({
        score_ratio_id: weight.score_ratio_id,
        score_category: "งานที่มอบหมาย",
      }),
    });
  });

  it("returns null for the score category when the activity has none", async () => {
    const course = await createCourse();
    await createActivity({ section_id: course.section_id });

    const response = await request(app)
      .get("/activity/list")
      .query({ section_id: course.section_id });

    expect(response.body.data[0].subject_score_ratio).toBeNull();
  });

  it("answers 400 when section_id is missing", async () => {
    await createActivity();

    const response = await request(app).get("/activity/list");

    expect(response.status).toBe(400);
    expect(response.body.errors).toEqual([
      { field: "section_id", location: "query", message: "ต้องระบุ" },
    ]);
  });
});

describe("GET /activity/options", () => {
  it("returns the section's activities as value and label", async () => {
    const course = await createCourse();
    const first = await createActivity({
      section_id: course.section_id,
      activity_name: "รายงานบทที่ 1",
    });
    const second = await createActivity({
      section_id: course.section_id,
      activity_name: "รายงานบทที่ 2",
    });
    await createActivity();

    const response = await request(app)
      .get("/activity/options")
      .query({ section_id: course.section_id });

    expect(response.status).toBe(200);
    expect(response.body.data).toEqual([
      { value: first.id, label: "รายงานบทที่ 1" },
      { value: second.id, label: "รายงานบทที่ 2" },
    ]);
  });

  it("answers 400 when section_id is missing", async () => {
    await createActivity();

    const response = await request(app).get("/activity/options");

    expect(response.status).toBe(400);
    expect(response.body.errors).toEqual([
      { field: "section_id", location: "query", message: "ต้องระบุ" },
    ]);
  });
});

describe("GET /activity/student/detail", () => {
  it("returns one student's submission alongside the activity itself", async () => {
    const student = await createStudent({ first_name_th: "สมชาย" });
    const activity = await createActivity({ activity_name: "รายงานบทที่ 1" });
    const submission = await createSubmission({
      student_id: student.student_id,
      activity_id: activity.id,
      status: "GRADED",
      score: 18,
      feedback: "ทำได้ดี",
    });

    const response = await request(app)
      .get("/activity/student/detail")
      .query({ student_activity_id: submission.id });

    expect(response.status).toBe(200);
    expect(response.body.data).toMatchObject({
      id: submission.id,
      activity_id: activity.id,
      activity_name: "รายงานบทที่ 1",
      student_id: student.student_id,
      status: "GRADED",
      score: 18,
      student_score: 18,
      feedback: "ทำได้ดี",
      student: { first_name_th: "สมชาย" },
      submitted_files: { file: [], url: [] },
    });
  });

  it("sends the marks as numbers, criterion by criterion", async () => {
    // student_activity.score and student_activity_rubric_score.calculated_score
    // are both Decimal(5,2), and this endpoint used to hand them to res.json as
    // Prisma Decimals — which reach the wire as strings, where every type that
    // describes them says number (#33).
    const activity = await createActivity();
    const rubric = await createActivityRubric({ activity_id: activity.id });
    const level = await prisma.rubric_levels.findFirstOrThrow({
      where: { rubric_id: rubric.id },
      orderBy: { level_no: "desc" },
    });
    const submission = await createSubmission({
      activity_id: activity.id,
      status: "GRADED",
      score: 17.5,
    });
    await prisma.student_activity_rubric_score.create({
      data: {
        student_activity_id: submission.id,
        rubric_activity_mapping_id: rubric.id,
        rubric_level_id: level.id,
        calculated_score: 17.5,
      },
    });

    const response = await request(app)
      .get("/activity/student/detail")
      .query({ student_activity_id: submission.id });

    expect(response.status).toBe(200);
    // Both keys carry the student's mark: the response spreads the whole
    // submission row in, so score arrives with it, and student_score is set
    // from the same value. The activity's own full mark is score_number, which
    // is what the callers read. That shape is not what #33 changed.
    expect(response.body.data.score).toBe(17.5);
    expect(response.body.data.student_score).toBe(17.5);
    expect(response.body.data.student_activity_rubric_score).toEqual([
      {
        rubric_activity_mapping_id: rubric.id,
        rubric_level_id: level.id,
        calculated_score: 17.5,
      },
    ]);
  });

  it("fails for a submission that does not exist", async () => {
    // Nothing found means the activity is looked up as id 0, which finds
    // nothing either, and the response ends up as an empty envelope.
    const response = await request(app)
      .get("/activity/student/detail")
      .query({ student_activity_id: 999_999 });

    expect(response.status).toBe(200);
    expect(response.body.data).toEqual({ submitted_files: { file: [], url: [] } });
  });

  it("answers 400 when no submission is named", async () => {
    const response = await request(app).get("/activity/student/detail");

    expect(response.status).toBe(400);
    expect(response.body.errors).toEqual([
      {
        field: "student_activity_id",
        location: "query",
        message: "ต้องระบุ",
      },
    ]);
  });
});

describe("GET /activity/submitted/list", () => {
  it("rejects a request with no session", async () => {
    const activity = await createActivity();

    const response = await request(app)
      .get("/activity/submitted/list")
      .query({ activity_id: activity.id });

    expect(response.status).toBe(401);
  });

  it("rejects a signed-in user who is not a teacher", async () => {
    const user = await createUser();
    const activity = await createActivity();

    const response = await request(app)
      .get("/activity/submitted/list")
      .query({ activity_id: activity.id })
      .set("Cookie", sessionCookie({ userId: user.user_id }));

    expect(response.status).toBe(403);
  });

  it("returns the students who have handed something in", async () => {
    const teacher = await createTeacher();
    const activity = await createActivity({
      activity_name: "รายงานบทที่ 1",
      score_number: 20,
    });
    const submitted = await createStudent({ first_name_th: "สมชาย" });
    const silent = await createStudent({ first_name_th: "สมหญิง" });
    const submission = await createSubmission({
      student_id: submitted.student_id,
      activity_id: activity.id,
      status: "SUBMITTED",
    });
    await createSubmission({
      student_id: silent.student_id,
      activity_id: activity.id,
      status: "NOT_SUBMITTED",
    });

    const response = await request(app)
      .get("/activity/submitted/list")
      .query({ activity_id: activity.id })
      .set("Cookie", sessionCookie({ userId: teacher.user_id }));

    expect(response.status).toBe(200);
    expect(response.body.data).toMatchObject({
      activity_id: activity.id,
      activity_name: "รายงานบทที่ 1",
      score: 20,
    });
    // Only the one who handed something in: a NOT_SUBMITTED row is a placeholder,
    // not a submission.
    expect(response.body.data.submissions).toEqual([
      expect.objectContaining({
        id: submission.id,
        submission_type: "INDIVIDUAL",
        status: "SUBMITTED",
        score: null,
        student: expect.objectContaining({
          student_id: submitted.student_id,
          first_name_th: "สมชาย",
        }),
      }),
    ]);
  });

  it("answers null for an activity that does not exist", async () => {
    const teacher = await createTeacher();

    const response = await request(app)
      .get("/activity/submitted/list")
      .query({ activity_id: 999_999 })
      .set("Cookie", sessionCookie({ userId: teacher.user_id }));

    expect(response.status).toBe(200);
    expect(response.body.data).toBeNull();
  });
});
