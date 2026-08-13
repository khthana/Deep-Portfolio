import { describe, expect, it } from "vitest";
import request from "supertest";
import app from "../src/app";
import prisma from "../src/config/prisma";
import {
  createActivity,
  createActivityGroup,
  createActivityRubric,
  createCLO,
  createCourse,
  createFileAttachment,
  createLinkAttachment,
  createStudent,
  createSubmission,
  createTeacher,
  mapActivityToCLO,
} from "./factories";
import { sessionCookie } from "./helpers/session";
import { signedFileUrl } from "./helpers/file-url";

/**
 * Marking a submission — /student-activity.
 *
 * Grading is where the rubric turns into a number. The teacher sends one level
 * per criterion; the endpoint works out what that is worth out of the
 * activity's full score, writes it on the submission, and pushes the same
 * proportion through to every CLO the activity is mapped to. For group work it
 * does all of that to every member at once, which is the whole reason the two
 * paths are separate — `activity_type` in the body picks between them.
 *
 * Grading and bookmarking are teacher-only. Reading a submission's attachments
 * is not guarded at all.
 */

/** An activity out of 100 with a single criterion worth all of it, so a level
 *  out of four is a score anyone can check in their head. */
async function gradableActivity(section_id?: number) {
  const activity = await createActivity({
    section_id,
    score_number: 100,
    activity_type: "individual",
  });
  const rubric = await createActivityRubric({
    activity_id: activity.id,
    weight: 100,
  });
  const levels = await prisma.rubric_levels.findMany({
    where: { rubric_id: rubric.id },
    orderBy: { level_no: "asc" },
  });

  return { activity, rubric, levels };
}

/** The body /student-activity/grade wants, for one criterion at one level. */
function gradeBody(options: {
  activity_id: number;
  student_id: string;
  student_activity_id: number;
  rubric_id: number;
  rubric_level_id: number;
  rubric_level_no: number;
  activity_type?: "INDIVIDUAL" | "GROUP";
  feedback?: string;
  remark?: string;
}) {
  return {
    activity_id: options.activity_id,
    student_id: options.student_id,
    student_activity_id: options.student_activity_id,
    activity_type: options.activity_type ?? "INDIVIDUAL",
    feedback: options.feedback ?? "ทำได้ดี",
    remark: options.remark ?? "",
    full_score: 100,
    total_level: 4,
    rubric_detail: [
      {
        rubric_id: options.rubric_id,
        rubric_level_id: options.rubric_level_id,
        rubric_level_no: options.rubric_level_no,
      },
    ],
  };
}

describe("POST /student-activity/grade", () => {
  it("scores an individual submission from the levels it is given", async () => {
    const teacher = await createTeacher();
    const { activity, rubric, levels } = await gradableActivity();
    const student = await createStudent();
    const submission = await createSubmission({
      activity_id: activity.id,
      student_id: student.student_id,
    });

    const response = await request(app)
      .post("/student-activity/grade")
      .set("Cookie", sessionCookie({ userId: teacher.user_id }))
      .send(
        gradeBody({
          activity_id: activity.id,
          student_id: student.student_id,
          student_activity_id: submission.id,
          rubric_id: rubric.id,
          rubric_level_id: levels[2].id,
          rubric_level_no: 3,
        }),
      );

    // One criterion worth all 100, marked 3 of 4 → 75.
    expect(response.status).toBe(200);
    expect(response.body.data).toEqual({
      student_activity_id: submission.id,
      total_score: 75,
    });

    const graded = await prisma.student_activity.findUniqueOrThrow({
      where: { id: submission.id },
    });
    expect(graded).toMatchObject({ status: "GRADED", feedback: "ทำได้ดี" });
    expect(Number(graded.score)).toBe(75);
    expect(graded.graded_at).not.toBeNull();

    // And the level chosen is kept, so re-opening the marking shows it back.
    expect(
      await prisma.student_activity_rubric_score.findMany({
        where: { student_activity_id: submission.id },
      }),
    ).toEqual([
      expect.objectContaining({
        rubric_activity_mapping_id: rubric.id,
        rubric_level_id: levels[2].id,
      }),
    ]);
  });

  it("replaces the levels a re-marked submission was given before", async () => {
    const teacher = await createTeacher();
    const { activity, rubric, levels } = await gradableActivity();
    const student = await createStudent();
    const submission = await createSubmission({
      activity_id: activity.id,
      student_id: student.student_id,
    });
    const body = gradeBody({
      activity_id: activity.id,
      student_id: student.student_id,
      student_activity_id: submission.id,
      rubric_id: rubric.id,
      rubric_level_id: levels[0].id,
      rubric_level_no: 1,
    });

    await request(app)
      .post("/student-activity/grade")
      .set("Cookie", sessionCookie({ userId: teacher.user_id }))
      .send(body);

    const response = await request(app)
      .post("/student-activity/grade")
      .set("Cookie", sessionCookie({ userId: teacher.user_id }))
      .send({
        ...body,
        rubric_detail: [
          {
            rubric_id: rubric.id,
            rubric_level_id: levels[3].id,
            rubric_level_no: 4,
          },
        ],
      });

    expect(response.status).toBe(200);
    expect(response.body.data.total_score).toBe(100);
    // One row, not two — the old marking is deleted rather than added to.
    expect(
      await prisma.student_activity_rubric_score.findMany({
        where: { student_activity_id: submission.id },
      }),
    ).toEqual([expect.objectContaining({ rubric_level_id: levels[3].id })]);
  });

  it("writes the student's share of every CLO the activity is mapped to", async () => {
    const teacher = await createTeacher();
    const course = await createCourse();
    const { activity, rubric, levels } = await gradableActivity(
      course.section_id,
    );
    const clo = await createCLO({ section_id: course.section_id });
    await mapActivityToCLO({
      activity_id: activity.id,
      clo_id: clo.clo_id,
      weight: 50,
    });
    const student = await createStudent();
    const submission = await createSubmission({
      activity_id: activity.id,
      student_id: student.student_id,
    });

    const response = await request(app)
      .post("/student-activity/grade")
      .set("Cookie", sessionCookie({ userId: teacher.user_id }))
      .send(
        gradeBody({
          activity_id: activity.id,
          student_id: student.student_id,
          student_activity_id: submission.id,
          rubric_id: rubric.id,
          rubric_level_id: levels[3].id,
          rubric_level_no: 4,
        }),
      );

    expect(response.status).toBe(200);

    // 100 out of 100 on an activity carrying 50% of the CLO → 50 towards it,
    // and the mapping itself records what the CLO was out of.
    const score = await prisma.activity_scores.findFirstOrThrow({
      where: { student_id: student.student_id, activity_id: activity.id },
    });
    expect(Number(score.score)).toBe(50);
    expect(score.clo_id).toBe(clo.clo_id.toString());

    const mapping = await prisma.activity_clo_mapping.findFirstOrThrow({
      where: { activity_id: activity.id },
    });
    expect(Number(mapping.score)).toBe(50);
  });

  it("gives every member of a group the same score", async () => {
    const teacher = await createTeacher();
    const { activity, rubric, levels } = await gradableActivity();
    const group = await createActivityGroup({
      activity_id: activity.id,
      members: [{}, { status: "ACCEPT" }],
    });
    const [leader, member] = group.student_activity_group_member;

    const response = await request(app)
      .post("/student-activity/grade")
      .set("Cookie", sessionCookie({ userId: teacher.user_id }))
      .send(
        gradeBody({
          activity_id: activity.id,
          student_id: leader.student_id,
          student_activity_id: leader.student_activity_id,
          rubric_id: rubric.id,
          rubric_level_id: levels[1].id,
          rubric_level_no: 2,
          activity_type: "GROUP",
        }),
      );

    expect(response.status).toBe(200);
    expect(response.body.data.total_score).toBe(50);

    const submissions = await prisma.student_activity.findMany({
      where: {
        id: { in: [leader.student_activity_id, member.student_activity_id] },
      },
    });
    expect(
      submissions.map((row) => [Number(row.score), row.status]),
    ).toEqual([
      [50, "GRADED"],
      [50, "GRADED"],
    ]);

    // The group is marked as a whole, so the group row moves too.
    expect(
      await prisma.student_activity_group.findUniqueOrThrow({
        where: { id: group.id },
      }),
    ).toMatchObject({ status: "GRADED" });
  });

  it("passes over a member who never answered the invitation", async () => {
    // Being named in a group is not being in it. Handing the work in already
    // means the members who accepted — submitGroupActivity filters on ACCEPT —
    // so marking used to write a score onto a row that still said
    // NOT_SUBMITTED, for someone who was never part of what was marked (#45,
    // ADR-0017).
    const teacher = await createTeacher();
    const course = await createCourse();
    const { activity, rubric, levels } = await gradableActivity(
      course.section_id,
    );
    const clo = await createCLO({ section_id: course.section_id });
    await mapActivityToCLO({
      activity_id: activity.id,
      clo_id: clo.clo_id,
      weight: 100,
    });
    const group = await createActivityGroup({ activity_id: activity.id });
    const [leader, invited] = group.student_activity_group_member;
    expect(invited.status).toBe("PENDING");

    const response = await request(app)
      .post("/student-activity/grade")
      .set("Cookie", sessionCookie({ userId: teacher.user_id }))
      .send(
        gradeBody({
          activity_id: activity.id,
          student_id: leader.student_id,
          student_activity_id: leader.student_activity_id,
          rubric_id: rubric.id,
          rubric_level_id: levels[1].id,
          rubric_level_no: 2,
          activity_type: "GROUP",
        }),
      );

    expect(response.status).toBe(200);
    expect(
      await prisma.student_activity.findUniqueOrThrow({
        where: { id: leader.student_activity_id },
      }),
    ).toMatchObject({ status: "GRADED" });

    // Left exactly as the group was assembled: no score, and still not handed
    // in as far as the row is concerned.
    expect(
      await prisma.student_activity.findUniqueOrThrow({
        where: { id: invited.student_activity_id },
      }),
    ).toMatchObject({ score: null, status: "NOT_SUBMITTED" });

    // The CLO half went through the same unfiltered list, so it gets its own
    // assertion: the invitation is not a mark towards the outcome either.
    expect(
      await prisma.activity_scores.findMany({
        where: { activity_id: activity.id },
        select: { student_id: true },
      }),
    ).toEqual([{ student_id: leader.student_id }]);
  });

  it("refuses to grade a group submission that is not in a group", async () => {
    // Pinned at 500 since #42, which mapped Prisma's P2025 and nothing else:
    // the service threw a bare `Error("Group not found")` before Prisma was
    // reached. #56 is what settled it, because it is what made this request
    // something a teacher can send by clicking: a student in no group now has
    // a row on the marking table, and the only link that row offers leads
    // here. The status is the one #42 already worked out — the body asked for
    // GROUP marking on a submission that has no group, so 400 rather than 404.
    // Whether such a student should be markable at all is #64.
    const teacher = await createTeacher();
    const { activity, rubric, levels } = await gradableActivity();
    const student = await createStudent();
    const submission = await createSubmission({
      activity_id: activity.id,
      student_id: student.student_id,
    });

    const response = await request(app)
      .post("/student-activity/grade")
      .set("Cookie", sessionCookie({ userId: teacher.user_id }))
      .send(
        gradeBody({
          activity_id: activity.id,
          student_id: student.student_id,
          student_activity_id: submission.id,
          rubric_id: rubric.id,
          rubric_level_id: levels[0].id,
          rubric_level_no: 1,
          activity_type: "GROUP",
        }),
      );

    expect(response.status).toBe(400);
    expect(response.body).toEqual({
      success: false,
      message: "นักศึกษาคนนี้ยังไม่ได้อยู่ในกลุ่มใด จึงยังให้คะแนนงานกลุ่มไม่ได้",
    });
    expect(
      await prisma.student_activity.findUniqueOrThrow({
        where: { id: submission.id },
      }),
    ).toMatchObject({ status: "SUBMITTED", score: null });
  });

  it("refuses a criterion that does not belong to the activity", async () => {
    // Still a 500 after #42: a bare `Error("Invalid rubric data")`, thrown when
    // the criterion is not among the activity's own, so no Prisma code reaches
    // the handler to be mapped.
    const teacher = await createTeacher();
    const { activity, levels } = await gradableActivity();
    const student = await createStudent();
    const submission = await createSubmission({
      activity_id: activity.id,
      student_id: student.student_id,
    });

    const response = await request(app)
      .post("/student-activity/grade")
      .set("Cookie", sessionCookie({ userId: teacher.user_id }))
      .send(
        gradeBody({
          activity_id: activity.id,
          student_id: student.student_id,
          student_activity_id: submission.id,
          rubric_id: 999_999,
          rubric_level_id: levels[0].id,
          rubric_level_no: 1,
        }),
      );

    expect(response.status).toBe(500);
    // Nothing is written: the whole marking is one transaction, so a criterion
    // it cannot price leaves the submission as it was.
    expect(
      await prisma.student_activity.findUniqueOrThrow({
        where: { id: submission.id },
      }),
    ).toMatchObject({ status: "SUBMITTED", score: null });
  });

  it("refuses a request with no session", async () => {
    const { activity, rubric, levels } = await gradableActivity();
    const student = await createStudent();
    const submission = await createSubmission({
      activity_id: activity.id,
      student_id: student.student_id,
    });

    const response = await request(app)
      .post("/student-activity/grade")
      .send(
        gradeBody({
          activity_id: activity.id,
          student_id: student.student_id,
          student_activity_id: submission.id,
          rubric_id: rubric.id,
          rubric_level_id: levels[3].id,
          rubric_level_no: 4,
        }),
      );

    expect(response.status).toBe(401);
    expect(response.body).toEqual({
      success: false,
      message: "ไม่พบ Token หรือ Token หมดอายุ",
    });
    expect(
      await prisma.student_activity.findUniqueOrThrow({
        where: { id: submission.id },
      }),
    ).toMatchObject({ status: "SUBMITTED" });
  });

  it("answers 400 when the marking says nothing about the rubric", async () => {
    // rubric_detail was read straight off the body and mapped over, so a
    // request without one was a 500 quoting a property of undefined.
    const teacher = await createTeacher();
    const { activity } = await gradableActivity();
    const student = await createStudent();
    const submission = await createSubmission({
      activity_id: activity.id,
      student_id: student.student_id,
    });

    const response = await request(app)
      .post("/student-activity/grade")
      .set("Cookie", sessionCookie({ userId: teacher.user_id }))
      .send({
        activity_id: activity.id,
        student_id: student.student_id,
        student_activity_id: submission.id,
        activity_type: "INDIVIDUAL",
        full_score: 100,
        total_level: 4,
      });

    expect(response.status).toBe(400);
    expect(response.body.errors).toEqual([
      { field: "rubric_detail", location: "body", message: "ต้องระบุ" },
    ]);
    expect(
      await prisma.student_activity.findUniqueOrThrow({
        where: { id: submission.id },
      }),
    ).toMatchObject({ status: "SUBMITTED", score: null });
  });

  it("answers 400 for a scale with no levels on it", async () => {
    // total_level is what the level chosen is divided by, so a zero used to
    // score the submission Infinity and fail on the way into the column.
    const teacher = await createTeacher();
    const { activity, rubric, levels } = await gradableActivity();
    const student = await createStudent();
    const submission = await createSubmission({
      activity_id: activity.id,
      student_id: student.student_id,
    });

    const response = await request(app)
      .post("/student-activity/grade")
      .set("Cookie", sessionCookie({ userId: teacher.user_id }))
      .send({
        ...gradeBody({
          activity_id: activity.id,
          student_id: student.student_id,
          student_activity_id: submission.id,
          rubric_id: rubric.id,
          rubric_level_id: levels[0].id,
          rubric_level_no: 1,
        }),
        total_level: 0,
      });

    expect(response.status).toBe(400);
    expect(response.body.errors).toEqual([
      { field: "total_level", location: "body", message: "ต้องมากกว่า 0" },
    ]);
    expect(
      await prisma.student_activity.findUniqueOrThrow({
        where: { id: submission.id },
      }),
    ).toMatchObject({ status: "SUBMITTED", score: null });
  });

  it("names the criterion that is wrong inside rubric_detail", async () => {
    const teacher = await createTeacher();
    const { activity, rubric, levels } = await gradableActivity();
    const student = await createStudent();
    const submission = await createSubmission({
      activity_id: activity.id,
      student_id: student.student_id,
    });

    const response = await request(app)
      .post("/student-activity/grade")
      .set("Cookie", sessionCookie({ userId: teacher.user_id }))
      .send({
        ...gradeBody({
          activity_id: activity.id,
          student_id: student.student_id,
          student_activity_id: submission.id,
          rubric_id: rubric.id,
          rubric_level_id: levels[0].id,
          rubric_level_no: 1,
        }),
        rubric_detail: [
          { rubric_id: rubric.id, rubric_level_id: levels[0].id },
        ],
      });

    expect(response.status).toBe(400);
    expect(response.body.errors).toEqual([
      {
        field: "rubric_detail[0].rubric_level_no",
        location: "body",
        message: "ต้องระบุ",
      },
    ]);
  });

  it("refuses a student marking their own work", async () => {
    const { activity, rubric, levels } = await gradableActivity();
    const student = await createStudent();
    const submission = await createSubmission({
      activity_id: activity.id,
      student_id: student.student_id,
    });

    const response = await request(app)
      .post("/student-activity/grade")
      .set("Cookie", sessionCookie({ userId: student.student_id }))
      .send(
        gradeBody({
          activity_id: activity.id,
          student_id: student.student_id,
          student_activity_id: submission.id,
          rubric_id: rubric.id,
          rubric_level_id: levels[3].id,
          rubric_level_no: 4,
        }),
      );

    expect(response.status).toBe(403);
    expect(response.body).toEqual({
      success: false,
      message: "สิทธิ์การเข้าถึงเฉพาะอาจารย์เท่านั้น",
    });
    expect(
      await prisma.student_activity.findUniqueOrThrow({
        where: { id: submission.id },
      }),
    ).toMatchObject({ status: "SUBMITTED", score: null });
  });
});

describe("PATCH /student-activity/bookmark", () => {
  it("bookmarks an individual submission", async () => {
    const teacher = await createTeacher();
    const submission = await createSubmission();

    const response = await request(app)
      .patch("/student-activity/bookmark")
      .set("Cookie", sessionCookie({ userId: teacher.user_id }))
      .send({
        activity_type: "INDIVIDUAL",
        student_activity_id: submission.id,
        is_bookmark: true,
      });

    expect(response.status).toBe(200);
    expect(response.body.data).toEqual({ is_bookmark: true });
    expect(
      await prisma.student_activity.findUniqueOrThrow({
        where: { id: submission.id },
      }),
    ).toMatchObject({ is_bookmark: true });
  });

  it("clears a bookmark it was asked to clear", async () => {
    const teacher = await createTeacher();
    const submission = await createSubmission({ is_bookmark: true });

    const response = await request(app)
      .patch("/student-activity/bookmark")
      .set("Cookie", sessionCookie({ userId: teacher.user_id }))
      .send({
        activity_type: "INDIVIDUAL",
        student_activity_id: submission.id,
        is_bookmark: false,
      });

    expect(response.status).toBe(200);
    expect(
      await prisma.student_activity.findUniqueOrThrow({
        where: { id: submission.id },
      }),
    ).toMatchObject({ is_bookmark: false });
  });

  it("bookmarks every member's submission for group work", async () => {
    // Every member row, including the one still PENDING — this path asks "who
    // is in this group" the wide way, which is what #45 narrowed on the two
    // paths that award marks. Left alone here on purpose: a bookmark is the
    // teacher's own flag for finding the work again, and setting it on a row
    // that was never handed in gives nobody a score they did not earn.
    // #53 has since put unanswered invitations in front of the teacher, and
    // ADR-0017 named this the place to look again when it did; ADR-0023 §4
    // looked, and left it as it is — the field it added carries names and a
    // status, never anyone's is_bookmark. See ADR-0017 §3 and ADR-0023 §4.
    const teacher = await createTeacher();
    const group = await createActivityGroup();
    const [leader, member] = group.student_activity_group_member;
    expect(member.status).toBe("PENDING");

    const response = await request(app)
      .patch("/student-activity/bookmark")
      .set("Cookie", sessionCookie({ userId: teacher.user_id }))
      .send({
        activity_type: "GROUP",
        student_activity_id: leader.student_activity_id,
        is_bookmark: true,
      });

    expect(response.status).toBe(200);
    expect(
      await prisma.student_activity.findMany({
        where: {
          id: { in: [leader.student_activity_id, member.student_activity_id] },
        },
        select: { is_bookmark: true },
      }),
    ).toEqual([{ is_bookmark: true }, { is_bookmark: true }]);
  });

  it("refuses to bookmark group work for a student who is in no group", async () => {
    // The other half of the same #56 row: the star on the marking table sends
    // GROUP because the activity is group work, and there is no group of rows
    // to set it on. This answered 500 until #56 made the row reachable.
    const teacher = await createTeacher();
    const submission = await createSubmission();

    const response = await request(app)
      .patch("/student-activity/bookmark")
      .set("Cookie", sessionCookie({ userId: teacher.user_id }))
      .send({
        activity_type: "GROUP",
        student_activity_id: submission.id,
        is_bookmark: true,
      });

    expect(response.status).toBe(400);
    expect(response.body).toEqual({
      success: false,
      message: "นักศึกษาคนนี้ยังไม่ได้อยู่ในกลุ่มใด จึงบันทึกงานกลุ่มไม่ได้",
    });
    expect(
      await prisma.student_activity.findUniqueOrThrow({
        where: { id: submission.id },
      }),
    ).toMatchObject({ is_bookmark: false });
  });

  it("answers 404 for a submission that does not exist", async () => {
    const teacher = await createTeacher();

    const response = await request(app)
      .patch("/student-activity/bookmark")
      .set("Cookie", sessionCookie({ userId: teacher.user_id }))
      .send({
        activity_type: "INDIVIDUAL",
        student_activity_id: 999_999,
        is_bookmark: true,
      });

    // P2025 used to leave here as a 500, telling the caller the server had
    // broken over a row that is merely absent (#42). These routes own no
    // sentence of their own, so the error handler's general one stands.
    expect(response.status).toBe(404);
    expect(response.body).toEqual({
      success: false,
      message: "ไม่พบข้อมูลที่ต้องการ",
    });
  });

  it("answers 400 when the request does not say which way to set it", async () => {
    // is_bookmark went into the update as it arrived, so a missing one used to
    // be written as null over a NOT NULL column.
    const teacher = await createTeacher();
    const submission = await createSubmission({ is_bookmark: true });

    const response = await request(app)
      .patch("/student-activity/bookmark")
      .set("Cookie", sessionCookie({ userId: teacher.user_id }))
      .send({
        activity_type: "INDIVIDUAL",
        student_activity_id: submission.id,
      });

    expect(response.status).toBe(400);
    expect(response.body.errors).toEqual([
      { field: "is_bookmark", location: "body", message: "ต้องระบุ" },
    ]);
    expect(
      await prisma.student_activity.findUniqueOrThrow({
        where: { id: submission.id },
      }),
    ).toMatchObject({ is_bookmark: true });
  });

  it("refuses a request with no session", async () => {
    const submission = await createSubmission();

    const response = await request(app)
      .patch("/student-activity/bookmark")
      .send({
        activity_type: "INDIVIDUAL",
        student_activity_id: submission.id,
        is_bookmark: true,
      });

    expect(response.status).toBe(401);
    expect(
      await prisma.student_activity.findUniqueOrThrow({
        where: { id: submission.id },
      }),
    ).toMatchObject({ is_bookmark: false });
  });

  it("refuses a student", async () => {
    const student = await createStudent();
    const submission = await createSubmission({
      student_id: student.student_id,
    });

    const response = await request(app)
      .patch("/student-activity/bookmark")
      .set("Cookie", sessionCookie({ userId: student.student_id }))
      .send({
        activity_type: "INDIVIDUAL",
        student_activity_id: submission.id,
        is_bookmark: true,
      });

    expect(response.status).toBe(403);
    expect(response.body).toEqual({
      success: false,
      message: "สิทธิ์การเข้าถึงเฉพาะอาจารย์เท่านั้น",
    });
    expect(
      await prisma.student_activity.findUniqueOrThrow({
        where: { id: submission.id },
      }),
    ).toMatchObject({ is_bookmark: false });
  });
});

describe("GET /student-activity/attachments", () => {
  it("returns the files and links handed in with a submission, in one list", async () => {
    const submission = await createSubmission();
    const file = await createFileAttachment({
      original_filename: "รายงาน.pdf",
      file_size: 2048,
    });
    const link = await createLinkAttachment({
      title: "ลิงก์งาน",
      url: "https://example.test/work",
    });
    await prisma.student_activity_attachments.createMany({
      data: [
        {
          student_activity_id: submission.id,
          attachment_id: file.attachment_id,
        },
        {
          student_activity_id: submission.id,
          attachment_id: link.attachment_id,
        },
      ],
    });

    const response = await request(app)
      .get("/student-activity/attachments")
      .query({ student_activity_id: submission.id });

    expect(response.status).toBe(200);
    // Both kinds come back under the same keys, with the ones a link has no
    // answer for left null — that is what lets the caller list them together.
    expect(response.body.data).toEqual([
      {
        attachment_id: file.attachment_id,
        url: signedFileUrl("example/รายงาน.pdf"),
        file_path: signedFileUrl("example/รายงาน.pdf"),
        original_filename: "รายงาน.pdf",
        file_size: 2048,
      },
      {
        attachment_id: link.attachment_id,
        url: "https://example.test/work",
        file_path: null,
        original_filename: "ลิงก์งาน",
        file_size: null,
      },
    ]);
  });

  it("returns an empty list for a submission with nothing attached", async () => {
    const submission = await createSubmission();

    const response = await request(app)
      .get("/student-activity/attachments")
      .query({ student_activity_id: submission.id });

    expect(response.status).toBe(200);
    expect(response.body.data).toEqual([]);
  });

  it("answers 400 when the student_activity_id is missing", async () => {
    // parseInt(undefined) was NaN, which Prisma sent as null against a NOT NULL
    // column — so the query was rejected rather than matching nothing.
    const response = await request(app).get("/student-activity/attachments");

    expect(response.status).toBe(400);
    expect(response.body).toEqual({
      success: false,
      message: "ข้อมูลที่ส่งมาไม่ถูกต้อง: student_activity_id ต้องระบุ",
      errors: [
        {
          field: "student_activity_id",
          location: "query",
          message: "ต้องระบุ",
        },
      ],
    });
  });
});
