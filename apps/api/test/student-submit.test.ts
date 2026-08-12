import { describe, expect, it } from "vitest";
import request from "supertest";
import app from "../src/app";
import prisma from "../src/config/prisma";
import {
  createActivity,
  createActivityGroup,
  createCourse,
  createFileAttachment,
  createLearningActivity,
  createLearningActivityGroup,
  createLearningSubmission,
  createStudent,
  createSubmission,
  createTeacher,
} from "./factories";
import { sessionCookie } from "./helpers/session";
import { listStoredObjects } from "./helpers/storage";

/**
 * Handing work in — POST /student/submit/activity and its learning-activity
 * twin.
 *
 * The two endpoints are the same shape twice over: multipart, files through
 * multer into MinIO, `urls` and `existing_files_ids` as JSON strings inside the
 * form, and a `type` field that chooses between submitting for yourself and
 * submitting for a whole group. Four service methods behind two routes.
 *
 * Three things are worth knowing before reading the cases:
 *
 * - Submitting replaces. Every attachment the submission had is unlinked first
 *   and only what this request names survives, which is what `existing_files_ids`
 *   is for — the file the student wants to keep has to be named again.
 * - The group path writes to everybody. One student's request marks every
 *   accepted member's submission SUBMITTED and gives them all the same
 *   attachments, so the assertions check a classmate's row too.
 * - The session decides who is submitting *and* what. student_activity_id comes
 *   from the body, so both halves are checked against the session before
 *   anything is written: the submission has to be the caller's, and a group
 *   submission has to be a group the caller accepted an invite to (#38).
 */

/** A one-pixel PNG, so the upload is a real file rather than a renamed text
 *  buffer. */
const PNG = Buffer.from(
  "89504e470d0a1a0a0000000d4948445200000001000000010806000000" +
    "1f15c4890000000a49444154789c6360000002000100ffff03000006000557bfabd4" +
    "0000000049454e44ae426082",
  "hex",
);

describe("POST /student/submit/activity", () => {
  it("marks the submission SUBMITTED and stores the uploaded file", async () => {
    const student = await createStudent();
    const course = await createCourse();
    const activity = await createActivity({ section_id: course.section_id });
    const submission = await createSubmission({
      student_id: student.student_id,
      activity_id: activity.id,
      status: "NOT_SUBMITTED",
      submitted_at: new Date("2020-01-01T00:00:00Z"),
    });

    const response = await request(app)
      .post("/student/submit/activity")
      .set("Cookie", sessionCookie({ userId: student.student_id }))
      .field("student_activity_id", String(submission.id))
      .field("section_id", String(course.section_id))
      .field("activity_id", String(activity.id))
      .field("type", "INDIVIDUAL")
      .attach("files", PNG, "งานส่ง.png");

    expect(response.status).toBe(200);
    expect(response.body.message).toBe("submit activity successfully");

    const stored = await prisma.student_activity.findUniqueOrThrow({
      where: { id: submission.id },
      include: { student_activity_attachments: true },
    });
    expect(stored.status).toBe("SUBMITTED");
    // Stamped now, not left at the date the row was arranged with.
    expect(stored.submitted_at!.getFullYear()).toBe(new Date().getFullYear());
    expect(stored.student_activity_attachments).toHaveLength(1);

    // The object really is in the bucket, under a path built from the section,
    // the activity and the student.
    const objects = await listStoredObjects(
      `${course.section_id}/activity/${activity.id}/${student.student_id}`,
    );
    expect(objects).toHaveLength(1);
  });

  it("records a link without uploading anything", async () => {
    const student = await createStudent();
    const course = await createCourse();
    const activity = await createActivity({ section_id: course.section_id });
    const submission = await createSubmission({
      student_id: student.student_id,
      activity_id: activity.id,
      status: "NOT_SUBMITTED",
    });

    const response = await request(app)
      .post("/student/submit/activity")
      .set("Cookie", sessionCookie({ userId: student.student_id }))
      .field("student_activity_id", String(submission.id))
      .field("section_id", String(course.section_id))
      .field("activity_id", String(activity.id))
      .field("type", "INDIVIDUAL")
      // urls arrives as a JSON string inside the form, not as a JSON body.
      .field(
        "urls",
        JSON.stringify([
          {
            title: "งานบน GitHub",
            url: "https://example.test/repo",
            uploaded_by: student.student_id,
          },
        ]),
      );

    expect(response.status).toBe(200);
    const attachments = await prisma.student_activity_attachments.findMany({
      where: { student_activity_id: submission.id },
      include: { attachments: true },
    });
    expect(attachments).toHaveLength(1);
    expect(attachments[0].attachments).toMatchObject({
      title: "งานบน GitHub",
      url: "https://example.test/repo",
      file_path: null,
    });
    // Nothing under this section's prefix: a link is a row, not an object. The
    // prefix is not decoration — the bucket is per file, not per case, so an
    // unprefixed listing would also show what the cases above uploaded.
    expect(await listStoredObjects(`${course.section_id}/`)).toEqual([]);
  });

  it("drops an attachment the resubmission does not name again", async () => {
    const student = await createStudent();
    const course = await createCourse();
    const activity = await createActivity({ section_id: course.section_id });
    const submission = await createSubmission({
      student_id: student.student_id,
      activity_id: activity.id,
    });
    const kept = await createFileAttachment({ title: "งานที่เก็บไว้" });
    const dropped = await createFileAttachment({ title: "งานที่ถูกแทนที่" });
    await prisma.student_activity_attachments.createMany({
      data: [kept.attachment_id, dropped.attachment_id].map(
        (attachment_id) => ({
          student_activity_id: submission.id,
          attachment_id,
        }),
      ),
    });

    const response = await request(app)
      .post("/student/submit/activity")
      .set("Cookie", sessionCookie({ userId: student.student_id }))
      .field("student_activity_id", String(submission.id))
      .field("section_id", String(course.section_id))
      .field("activity_id", String(activity.id))
      .field("type", "INDIVIDUAL")
      .field("existing_files_ids", JSON.stringify([kept.attachment_id]));

    expect(response.status).toBe(200);
    const linked = await prisma.student_activity_attachments.findMany({
      where: { student_activity_id: submission.id },
    });
    expect(linked.map((a) => a.attachment_id)).toEqual([kept.attachment_id]);

    // The replaced file goes with its last join row (#34), and the one the
    // resubmission named again survives — it is linked back in the same
    // transaction, so the sweep never sees it unreferenced.
    expect(
      await prisma.attachments.findUnique({
        where: { attachment_id: dropped.attachment_id },
      }),
    ).toBeNull();
    expect(
      await prisma.attachments.findUnique({
        where: { attachment_id: kept.attachment_id },
      }),
    ).not.toBeNull();
  });

  it("keeps the file a resubmission names again, object and all", async () => {
    // The sweep runs after the resubmission has linked its files back, so the
    // one named again is never unreferenced and never swept (#34, ADR-0008).
    // Read here through the bucket rather than the rows, because #52 added a
    // second thing that removes objects — the one that runs when the
    // transaction fails — and it must not reach a request that succeeded.
    const student = await createStudent();
    const course = await createCourse();
    const activity = await createActivity({ section_id: course.section_id });
    const submission = await createSubmission({
      student_id: student.student_id,
      activity_id: activity.id,
      status: "NOT_SUBMITTED",
    });
    const prefix = `${course.section_id}/activity/${activity.id}/${student.student_id}`;

    const submit = (filename: string, keep: number[]) =>
      request(app)
        .post("/student/submit/activity")
        .set("Cookie", sessionCookie({ userId: student.student_id }))
        .field("student_activity_id", String(submission.id))
        .field("section_id", String(course.section_id))
        .field("activity_id", String(activity.id))
        .field("type", "INDIVIDUAL")
        .field("existing_files_ids", JSON.stringify(keep))
        .attach("files", PNG, filename);

    expect((await submit("งานฉบับแรก.png", [])).status).toBe(200);
    const first = await prisma.attachments.findFirstOrThrow({
      where: { title: "งานฉบับแรก.png" },
    });

    expect((await submit("งานฉบับสอง.png", [first.attachment_id])).status).toBe(
      200,
    );

    expect(
      await prisma.attachments.findUnique({
        where: { attachment_id: first.attachment_id },
      }),
    ).not.toBeNull();
    expect(
      await prisma.student_activity_attachments.count({
        where: { student_activity_id: submission.id },
      }),
    ).toBe(2);
    expect(await listStoredObjects(prefix)).toHaveLength(2);
  });

  it("takes the uploaded file back out of the bucket when it fails", async () => {
    // The rows roll back by themselves here — this path has always passed `tx`
    // — but the object left the process before any row named it, so a failure
    // used to leave it in the bucket with the only record of its key gone
    // (#52). The failure is a file the student names again that is not there
    // any more: it reaches the join table as a foreign key nothing satisfies,
    // which is after the upload.
    const student = await createStudent();
    const course = await createCourse();
    const activity = await createActivity({ section_id: course.section_id });
    const submission = await createSubmission({
      student_id: student.student_id,
      activity_id: activity.id,
      status: "NOT_SUBMITTED",
    });

    const response = await request(app)
      .post("/student/submit/activity")
      .set("Cookie", sessionCookie({ userId: student.student_id }))
      .field("student_activity_id", String(submission.id))
      .field("section_id", String(course.section_id))
      .field("activity_id", String(activity.id))
      .field("type", "INDIVIDUAL")
      .field("existing_files_ids", JSON.stringify([999999]))
      .attach("files", PNG, "งานที่ไม่เคยถึงปลายทาง.png");

    expect(response.status).toBe(500);

    const prefix = `${course.section_id}/activity/${activity.id}/${student.student_id}`;
    expect(await listStoredObjects(prefix)).toEqual([]);
    expect(
      await prisma.attachments.count({
        where: { file_path: { startsWith: prefix } },
      }),
    ).toBe(0);
    // And the submission is where it was: nothing about the request landed.
    expect(
      (
        await prisma.student_activity.findUniqueOrThrow({
          where: { id: submission.id },
        })
      ).status,
    ).toBe("NOT_SUBMITTED");
  });

  it("submits for every accepted member of a group at once", async () => {
    const leader = await createStudent();
    const member = await createStudent();
    const invited = await createStudent();
    const course = await createCourse();
    const activity = await createActivity({ section_id: course.section_id });
    const group = await createActivityGroup({
      activity_id: activity.id,
      members: [
        { student_id: leader.student_id },
        { student_id: member.student_id, status: "ACCEPT" },
        // Never answered the invite, so this one is left where it was.
        { student_id: invited.student_id, status: "PENDING" },
      ],
    });
    const leaderSubmission = group.student_activity_group_member.find(
      (m) => m.student_id === leader.student_id,
    )!;

    const response = await request(app)
      .post("/student/submit/activity")
      .set("Cookie", sessionCookie({ userId: leader.student_id }))
      .field(
        "student_activity_id",
        String(leaderSubmission.student_activity_id),
      )
      .field("section_id", String(course.section_id))
      .field("activity_id", String(activity.id))
      .field("type", "GROUP")
      .field("group_id", String(group.id))
      .attach("files", PNG, "งานกลุ่ม.png");

    expect(response.status).toBe(200);

    const submissions = await prisma.student_activity.findMany({
      where: { activity_id: activity.id },
      include: { student_activity_attachments: true },
      orderBy: { student_id: "asc" },
    });
    const byStudent = new Map(submissions.map((s) => [s.student_id, s]));

    for (const student of [leader, member]) {
      const own = byStudent.get(student.student_id)!;
      expect(own.status).toBe("SUBMITTED");
      // One upload, shared: everybody is linked to the same attachment.
      expect(own.student_activity_attachments).toHaveLength(1);
    }

    // The one who never answered the invite is not in the group as far as this
    // endpoint is concerned — the members query asks for ACCEPT only — so their
    // own submission is untouched and they still owe the work.
    const untouched = byStudent.get(invited.student_id)!;
    expect(untouched.status).toBe("NOT_SUBMITTED");
    expect(untouched.student_activity_attachments).toEqual([]);

    expect(
      (
        await prisma.student_activity_group.findUniqueOrThrow({
          where: { id: group.id },
        })
      ).status,
    ).toBe("SUBMITTED");

    // Uploaded once, under the group's path rather than any one student's.
    const objects = await listStoredObjects(
      `${course.section_id}/activity/${activity.id}/group-${group.id}`,
    );
    expect(objects).toHaveLength(1);
  });

  it("replaces the group's file on a resubmission", async () => {
    const leader = await createStudent();
    const member = await createStudent();
    const course = await createCourse();
    const activity = await createActivity({ section_id: course.section_id });
    const group = await createActivityGroup({
      activity_id: activity.id,
      members: [
        { student_id: leader.student_id },
        { student_id: member.student_id, status: "ACCEPT" },
      ],
    });
    const leaderSubmission = group.student_activity_group_member.find(
      (m) => m.student_id === leader.student_id,
    )!;
    const groupPrefix = `${course.section_id}/activity/${activity.id}/group-${group.id}`;

    const submit = (filename: string) =>
      request(app)
        .post("/student/submit/activity")
        .set("Cookie", sessionCookie({ userId: leader.student_id }))
        .field(
          "student_activity_id",
          String(leaderSubmission.student_activity_id),
        )
        .field("section_id", String(course.section_id))
        .field("activity_id", String(activity.id))
        .field("type", "GROUP")
        .field("group_id", String(group.id))
        .attach("files", PNG, filename);

    expect((await submit("งานกลุ่มฉบับแรก.png")).status).toBe(200);
    const first = await prisma.attachments.findFirstOrThrow({
      where: { title: "งานกลุ่มฉบับแรก.png" },
    });

    expect((await submit("งานกลุ่มฉบับสอง.png")).status).toBe(200);

    // The first file is nobody's any more once every member is linked to the
    // second, so it goes — row and object (#34).
    expect(
      await prisma.attachments.findUnique({
        where: { attachment_id: first.attachment_id },
      }),
    ).toBeNull();
    expect(await listStoredObjects(groupPrefix)).toHaveLength(1);

    const submissions = await prisma.student_activity.findMany({
      where: { activity_id: activity.id },
      include: { student_activity_attachments: true },
    });
    for (const submission of submissions) {
      expect(submission.student_activity_attachments).toHaveLength(1);
      expect(submission.student_activity_attachments[0].attachment_id).not.toBe(
        first.attachment_id,
      );
    }
  });

  it("takes the group's upload back out of the bucket when it fails", async () => {
    // Same failure as the individual path, one upload standing for the whole
    // group: nobody's rows change, and the file that was uploaded once for all
    // of them goes back out of the bucket (#52).
    const leader = await createStudent();
    const member = await createStudent();
    const course = await createCourse();
    const activity = await createActivity({ section_id: course.section_id });
    const group = await createActivityGroup({
      activity_id: activity.id,
      members: [
        { student_id: leader.student_id },
        { student_id: member.student_id, status: "ACCEPT" },
      ],
    });
    const leaderSubmission = group.student_activity_group_member.find(
      (m) => m.student_id === leader.student_id,
    )!;

    const response = await request(app)
      .post("/student/submit/activity")
      .set("Cookie", sessionCookie({ userId: leader.student_id }))
      .field(
        "student_activity_id",
        String(leaderSubmission.student_activity_id),
      )
      .field("section_id", String(course.section_id))
      .field("activity_id", String(activity.id))
      .field("type", "GROUP")
      .field("group_id", String(group.id))
      .field("existing_files_ids", JSON.stringify([999999]))
      .attach("files", PNG, "งานกลุ่มที่ไม่เคยถึงปลายทาง.png");

    expect(response.status).toBe(500);

    const groupPrefix = `${course.section_id}/activity/${activity.id}/group-${group.id}`;
    expect(await listStoredObjects(groupPrefix)).toEqual([]);
    expect(
      await prisma.attachments.count({
        where: { file_path: { startsWith: groupPrefix } },
      }),
    ).toBe(0);
    const submissions = await prisma.student_activity.findMany({
      where: { activity_id: activity.id },
    });
    for (const submission of submissions) {
      expect(submission.status).toBe("NOT_SUBMITTED");
    }
  });

  it("answers 400 for a group with nobody who accepted", async () => {
    // Nobody has answered the invite yet, so there is no group to submit for.
    // That is the caller's state, not the server's, and it used to be a 500
    // with an English sentence the frontend rendered as-is.
    const leader = await createStudent();
    const course = await createCourse();
    const activity = await createActivity({ section_id: course.section_id });
    const group = await createActivityGroup({
      activity_id: activity.id,
      members: [{ student_id: leader.student_id, status: "PENDING" }],
    });
    const membership = group.student_activity_group_member[0];

    const response = await request(app)
      .post("/student/submit/activity")
      .set("Cookie", sessionCookie({ userId: leader.student_id }))
      .field("student_activity_id", String(membership.student_activity_id))
      .field("section_id", String(course.section_id))
      .field("activity_id", String(activity.id))
      .field("type", "GROUP")
      .field("group_id", String(group.id));

    expect(response.status).toBe(400);
    expect(response.body.message).toBe(
      "ยังไม่มีสมาชิกที่ตอบรับคำเชิญในกลุ่มนี้",
    );
    expect(
      (
        await prisma.student_activity.findUniqueOrThrow({
          where: { id: membership.student_activity_id! },
        })
      ).status,
    ).toBe("NOT_SUBMITTED");
  });

  it("answers 404 for a student_activity_id that belongs to no submission", async () => {
    const student = await createStudent();
    const course = await createCourse();

    const response = await request(app)
      .post("/student/submit/activity")
      .set("Cookie", sessionCookie({ userId: student.student_id }))
      .field("student_activity_id", "999999")
      .field("section_id", String(course.section_id))
      .field("activity_id", "999999")
      .field("type", "INDIVIDUAL");

    expect(response.status).toBe(404);
    expect(response.body.message).toBe("ไม่พบงานที่ต้องการส่ง");
  });

  it("refuses a submission id that belongs to a classmate", async () => {
    // The session says who is asking, the body says what is being submitted,
    // and the two have to agree. A student who knows a classmate's
    // student_activity_id used to be able to hand the work in for them — and
    // the classmate's own attachments were replaced by whatever that request
    // carried. #38.
    const student = await createStudent();
    const classmate = await createStudent();
    const course = await createCourse();
    const activity = await createActivity({ section_id: course.section_id });
    const theirs = await createSubmission({
      student_id: classmate.student_id,
      activity_id: activity.id,
      status: "NOT_SUBMITTED",
    });
    const kept = await createFileAttachment({ title: "งานของเพื่อน" });
    await prisma.student_activity_attachments.create({
      data: {
        student_activity_id: theirs.id,
        attachment_id: kept.attachment_id,
      },
    });

    const response = await request(app)
      .post("/student/submit/activity")
      .set("Cookie", sessionCookie({ userId: student.student_id }))
      .field("student_activity_id", String(theirs.id))
      .field("section_id", String(course.section_id))
      .field("activity_id", String(activity.id))
      .field("type", "INDIVIDUAL")
      .attach("files", PNG, "งานที่ยัดให้เพื่อน.png");

    expect(response.status).toBe(403);
    expect(response.body.message).toBe("ส่งงานได้เฉพาะงานของตัวเองเท่านั้น");

    // Nothing of the classmate's moved: not the status, not the attachment the
    // request would have replaced, and nothing reached the bucket.
    const untouched = await prisma.student_activity.findUniqueOrThrow({
      where: { id: theirs.id },
      include: { student_activity_attachments: true },
    });
    expect(untouched.status).toBe("NOT_SUBMITTED");
    expect(
      untouched.student_activity_attachments.map((a) => a.attachment_id),
    ).toEqual([kept.attachment_id]);
    expect(
      await listStoredObjects(`${course.section_id}/activity/${activity.id}/`),
    ).toEqual([]);
  });

  it("refuses a group the caller never joined", async () => {
    // A group submission writes to every accepted member at once, so naming a
    // group you are not in is naming other people's work — the same hole as
    // above, one level up. #38.
    const leader = await createStudent();
    const outsider = await createStudent();
    const course = await createCourse();
    const activity = await createActivity({ section_id: course.section_id });
    const group = await createActivityGroup({
      activity_id: activity.id,
      members: [{ student_id: leader.student_id, status: "ACCEPT" }],
    });
    // The outsider has their own submission for the same activity, so the id
    // they name is genuinely theirs — only the group is not.
    const own = await createSubmission({
      student_id: outsider.student_id,
      activity_id: activity.id,
      status: "NOT_SUBMITTED",
    });

    const response = await request(app)
      .post("/student/submit/activity")
      .set("Cookie", sessionCookie({ userId: outsider.student_id }))
      .field("student_activity_id", String(own.id))
      .field("section_id", String(course.section_id))
      .field("activity_id", String(activity.id))
      .field("type", "GROUP")
      .field("group_id", String(group.id));

    expect(response.status).toBe(403);
    expect(response.body.message).toBe(
      "ส่งงานกลุ่มได้เฉพาะกลุ่มที่ตัวเองเป็นสมาชิกเท่านั้น",
    );

    const submissions = await prisma.student_activity.findMany({
      where: { activity_id: activity.id },
    });
    expect(submissions.map((s) => s.status)).toEqual(
      submissions.map(() => "NOT_SUBMITTED"),
    );
    expect(
      (
        await prisma.student_activity_group.findUniqueOrThrow({
          where: { id: group.id },
        })
      ).status,
    ).not.toBe("SUBMITTED");
  });

  it("refuses a group member who names a teammate's submission id", async () => {
    // Being in the group is not enough on its own: the reply carries the detail
    // of whichever submission was named, so it has to be the caller's own. #38.
    const leader = await createStudent();
    const member = await createStudent();
    const course = await createCourse();
    const activity = await createActivity({ section_id: course.section_id });
    const group = await createActivityGroup({
      activity_id: activity.id,
      members: [
        { student_id: leader.student_id },
        { student_id: member.student_id, status: "ACCEPT" },
      ],
    });
    const leaderSubmission = group.student_activity_group_member.find(
      (m) => m.student_id === leader.student_id,
    )!;

    const response = await request(app)
      .post("/student/submit/activity")
      .set("Cookie", sessionCookie({ userId: member.student_id }))
      .field(
        "student_activity_id",
        String(leaderSubmission.student_activity_id),
      )
      .field("section_id", String(course.section_id))
      .field("activity_id", String(activity.id))
      .field("type", "GROUP")
      .field("group_id", String(group.id));

    expect(response.status).toBe(403);
    expect(response.body.message).toBe("ส่งงานได้เฉพาะงานของตัวเองเท่านั้น");
    expect(
      (
        await prisma.student_activity.findUniqueOrThrow({
          where: { id: leaderSubmission.student_activity_id! },
        })
      ).status,
    ).toBe("NOT_SUBMITTED");
  });

  it("answers 400 for a group submission that names no group", async () => {
    // `where: { group_id: undefined }` is no filter at all, so this request used
    // to succeed by writing to every group in the system: every accepted
    // member's submission marked SUBMITTED, all of them linked to this one
    // upload, and the object stored under `group-undefined`.
    const leader = await createStudent();
    const course = await createCourse();
    const activity = await createActivity({ section_id: course.section_id });
    const group = await createActivityGroup({
      activity_id: activity.id,
      members: [{ student_id: leader.student_id, status: "ACCEPT" }],
    });
    const membership = group.student_activity_group_member[0];

    const response = await request(app)
      .post("/student/submit/activity")
      .set("Cookie", sessionCookie({ userId: leader.student_id }))
      .field("student_activity_id", String(membership.student_activity_id))
      .field("section_id", String(course.section_id))
      .field("activity_id", String(activity.id))
      .field("type", "GROUP");

    expect(response.status).toBe(400);
    expect(response.body.errors).toEqual([
      {
        field: "group_id",
        location: "body",
        message: "ต้องระบุเมื่อส่งงานแบบกลุ่ม",
      },
    ]);
    expect(
      (
        await prisma.student_activity.findUniqueOrThrow({
          where: { id: membership.student_activity_id! },
        })
      ).status,
    ).toBe("NOT_SUBMITTED");
  });

  it("answers 400 for a urls field that is not JSON", async () => {
    // The controller used to hand this straight to JSON.parse inside its try
    // block, so a form field the student never typed became a 500 about a
    // syntax error at position 0.
    const student = await createStudent();
    const course = await createCourse();
    const activity = await createActivity({ section_id: course.section_id });
    const submission = await createSubmission({
      student_id: student.student_id,
      activity_id: activity.id,
      status: "NOT_SUBMITTED",
    });

    const response = await request(app)
      .post("/student/submit/activity")
      .set("Cookie", sessionCookie({ userId: student.student_id }))
      .field("student_activity_id", String(submission.id))
      .field("section_id", String(course.section_id))
      .field("activity_id", String(activity.id))
      .field("type", "INDIVIDUAL")
      .field("urls", "ไม่ใช่ JSON");

    expect(response.status).toBe(400);
    expect(response.body.errors).toEqual([
      { field: "urls", location: "body", message: "ต้องเป็นรายการ" },
    ]);
    expect(
      (
        await prisma.student_activity.findUniqueOrThrow({
          where: { id: submission.id },
        })
      ).status,
    ).toBe("NOT_SUBMITTED");
  });

  it("refuses a request with no session", async () => {
    const submission = await createSubmission({ status: "NOT_SUBMITTED" });

    const response = await request(app)
      .post("/student/submit/activity")
      .field("student_activity_id", String(submission.id))
      .field("type", "INDIVIDUAL");

    expect(response.status).toBe(401);
    expect(response.body).toEqual({
      success: false,
      message: "ไม่พบ Token หรือ Token หมดอายุ",
    });
    expect(
      (
        await prisma.student_activity.findUniqueOrThrow({
          where: { id: submission.id },
        })
      ).status,
    ).toBe("NOT_SUBMITTED");
  });

  it("refuses a teacher, without buffering their upload", async () => {
    // requireRole is registered ahead of multer on this route, so a refused
    // request never reaches the bucket.
    const teacher = await createTeacher();
    const submission = await createSubmission({ status: "NOT_SUBMITTED" });
    // What the earlier cases left behind, since the bucket is shared by the
    // whole file. The claim is that this request adds nothing to it.
    const before = await listStoredObjects();

    const response = await request(app)
      .post("/student/submit/activity")
      .set("Cookie", sessionCookie({ userId: teacher.user_id }))
      .field("student_activity_id", String(submission.id))
      .field("type", "INDIVIDUAL")
      .attach("files", PNG, "งานส่ง.png");

    expect(response.status).toBe(403);
    expect(response.body).toEqual({
      success: false,
      message: "สิทธิ์การเข้าถึงเฉพาะนักศึกษาเท่านั้น",
    });
    expect(await listStoredObjects()).toEqual(before);
  });
});

describe("POST /student/submit/learning-activity", () => {
  it("marks the submission SUBMITTED and stores the uploaded file", async () => {
    const student = await createStudent();
    const course = await createCourse();
    const learningActivity = await createLearningActivity({
      section_id: course.section_id,
    });
    const submission = await createLearningSubmission({
      student_id: student.student_id,
      learning_activity_id: learningActivity.id,
      status: "NOT_SUBMITTED",
    });

    const response = await request(app)
      .post("/student/submit/learning-activity")
      .set("Cookie", sessionCookie({ userId: student.student_id }))
      .field("student_learning_activity_id", String(submission.id))
      .field("section_id", String(course.section_id))
      .field("learning_activity_id", String(learningActivity.id))
      .field("type", "INDIVIDUAL")
      .attach("files", PNG, "กิจกรรม.png");

    expect(response.status).toBe(200);
    const stored = await prisma.student_learning_activity.findUniqueOrThrow({
      where: { id: submission.id },
      include: { student_learning_activity_attachments: true },
    });
    expect(stored.status).toBe("SUBMITTED");
    expect(stored.submitted_at).not.toBeNull();
    expect(stored.student_learning_activity_attachments).toHaveLength(1);

    const objects = await listStoredObjects(
      `${course.section_id}/learning-activity/${learningActivity.id}/${student.student_id}`,
    );
    expect(objects).toHaveLength(1);
  });

  it("drops an attachment the resubmission does not name again", async () => {
    const student = await createStudent();
    const course = await createCourse();
    const learningActivity = await createLearningActivity({
      section_id: course.section_id,
    });
    const submission = await createLearningSubmission({
      student_id: student.student_id,
      learning_activity_id: learningActivity.id,
    });
    const dropped = await createFileAttachment({ title: "งานที่ถูกแทนที่" });
    await prisma.student_learning_activity_attachments.create({
      data: {
        student_learning_activity_id: submission.id,
        attachment_id: dropped.attachment_id,
      },
    });

    const response = await request(app)
      .post("/student/submit/learning-activity")
      .set("Cookie", sessionCookie({ userId: student.student_id }))
      .field("student_learning_activity_id", String(submission.id))
      .field("section_id", String(course.section_id))
      .field("learning_activity_id", String(learningActivity.id))
      .field("type", "INDIVIDUAL");

    expect(response.status).toBe(200);
    expect(
      await prisma.student_learning_activity_attachments.findMany({
        where: { student_learning_activity_id: submission.id },
      }),
    ).toEqual([]);

    // The replaced file goes with its last join row (#34).
    expect(
      await prisma.attachments.findUnique({
        where: { attachment_id: dropped.attachment_id },
      }),
    ).toBeNull();
  });

  it("submits for every accepted member of a group at once", async () => {
    const leader = await createStudent();
    const member = await createStudent();
    const course = await createCourse();
    const learningActivity = await createLearningActivity({
      section_id: course.section_id,
    });
    const group = await createLearningActivityGroup({
      learning_activity_id: learningActivity.id,
      members: [
        { student_id: leader.student_id },
        { student_id: member.student_id, status: "ACCEPT" },
      ],
    });
    const leaderMembership = group.student_learning_activity_group_member.find(
      (m) => m.student_id === leader.student_id,
    )!;

    const response = await request(app)
      .post("/student/submit/learning-activity")
      .set("Cookie", sessionCookie({ userId: leader.student_id }))
      .field(
        "student_learning_activity_id",
        String(leaderMembership.student_learning_activity_id),
      )
      .field("section_id", String(course.section_id))
      .field("learning_activity_id", String(learningActivity.id))
      .field("type", "GROUP")
      .field("group_id", String(group.id))
      .attach("files", PNG, "กิจกรรมกลุ่ม.png");

    expect(response.status).toBe(200);
    const submissions = await prisma.student_learning_activity.findMany({
      where: { learning_activity_id: learningActivity.id },
      include: { student_learning_activity_attachments: true },
    });
    expect(submissions).toHaveLength(2);
    for (const submission of submissions) {
      expect(submission.status).toBe("SUBMITTED");
      expect(submission.student_learning_activity_attachments).toHaveLength(1);
    }

    const objects = await listStoredObjects(
      `${course.section_id}/learning-activity/${learningActivity.id}/group-${group.id}`,
    );
    expect(objects).toHaveLength(1);
  });

  it("takes the uploaded file back out of the bucket when it fails", async () => {
    // The learning-activity twin of the same rollback (#52).
    const student = await createStudent();
    const course = await createCourse();
    const learningActivity = await createLearningActivity({
      section_id: course.section_id,
    });
    const submission = await createLearningSubmission({
      student_id: student.student_id,
      learning_activity_id: learningActivity.id,
      status: "NOT_SUBMITTED",
    });

    const response = await request(app)
      .post("/student/submit/learning-activity")
      .set("Cookie", sessionCookie({ userId: student.student_id }))
      .field("student_learning_activity_id", String(submission.id))
      .field("section_id", String(course.section_id))
      .field("learning_activity_id", String(learningActivity.id))
      .field("type", "INDIVIDUAL")
      .field("existing_files_ids", JSON.stringify([999999]))
      .attach("files", PNG, "กิจกรรมที่ไม่เคยถึงปลายทาง.png");

    expect(response.status).toBe(500);

    const prefix = `${course.section_id}/learning-activity/${learningActivity.id}/${student.student_id}`;
    expect(await listStoredObjects(prefix)).toEqual([]);
    expect(
      await prisma.attachments.count({
        where: { file_path: { startsWith: prefix } },
      }),
    ).toBe(0);
    expect(
      (
        await prisma.student_learning_activity.findUniqueOrThrow({
          where: { id: submission.id },
        })
      ).status,
    ).toBe("NOT_SUBMITTED");
  });

  it("takes the group's upload back out of the bucket when it fails", async () => {
    // And its group twin, where the one upload belongs to everybody (#52).
    const leader = await createStudent();
    const member = await createStudent();
    const course = await createCourse();
    const learningActivity = await createLearningActivity({
      section_id: course.section_id,
    });
    const group = await createLearningActivityGroup({
      learning_activity_id: learningActivity.id,
      members: [
        { student_id: leader.student_id },
        { student_id: member.student_id, status: "ACCEPT" },
      ],
    });
    const leaderMembership = group.student_learning_activity_group_member.find(
      (m) => m.student_id === leader.student_id,
    )!;

    const response = await request(app)
      .post("/student/submit/learning-activity")
      .set("Cookie", sessionCookie({ userId: leader.student_id }))
      .field(
        "student_learning_activity_id",
        String(leaderMembership.student_learning_activity_id),
      )
      .field("section_id", String(course.section_id))
      .field("learning_activity_id", String(learningActivity.id))
      .field("type", "GROUP")
      .field("group_id", String(group.id))
      .field("existing_files_ids", JSON.stringify([999999]))
      .attach("files", PNG, "กิจกรรมกลุ่มที่ไม่เคยถึงปลายทาง.png");

    expect(response.status).toBe(500);

    const groupPrefix = `${course.section_id}/learning-activity/${learningActivity.id}/group-${group.id}`;
    expect(await listStoredObjects(groupPrefix)).toEqual([]);
    expect(
      await prisma.attachments.count({
        where: { file_path: { startsWith: groupPrefix } },
      }),
    ).toBe(0);
    const submissions = await prisma.student_learning_activity.findMany({
      where: { learning_activity_id: learningActivity.id },
    });
    for (const submission of submissions) {
      expect(submission.status).toBe("NOT_SUBMITTED");
    }
  });

  it("answers 404 for an id that belongs to no submission", async () => {
    const student = await createStudent();
    const course = await createCourse();

    const response = await request(app)
      .post("/student/submit/learning-activity")
      .set("Cookie", sessionCookie({ userId: student.student_id }))
      .field("student_learning_activity_id", "999999")
      .field("section_id", String(course.section_id))
      .field("learning_activity_id", "999999")
      .field("type", "INDIVIDUAL");

    expect(response.status).toBe(404);
    expect(response.body.message).toBe("ไม่พบงานที่ต้องการส่ง");
  });

  it("refuses a submission id that belongs to a classmate", async () => {
    // The twin of the activity case: same hole, same refusal (#38).
    const student = await createStudent();
    const classmate = await createStudent();
    const course = await createCourse();
    const learningActivity = await createLearningActivity({
      section_id: course.section_id,
    });
    const theirs = await createLearningSubmission({
      student_id: classmate.student_id,
      learning_activity_id: learningActivity.id,
      status: "NOT_SUBMITTED",
    });

    const response = await request(app)
      .post("/student/submit/learning-activity")
      .set("Cookie", sessionCookie({ userId: student.student_id }))
      .field("student_learning_activity_id", String(theirs.id))
      .field("section_id", String(course.section_id))
      .field("learning_activity_id", String(learningActivity.id))
      .field("type", "INDIVIDUAL")
      .attach("files", PNG, "งานที่ยัดให้เพื่อน.png");

    expect(response.status).toBe(403);
    expect(response.body.message).toBe("ส่งงานได้เฉพาะงานของตัวเองเท่านั้น");

    const untouched = await prisma.student_learning_activity.findUniqueOrThrow({
      where: { id: theirs.id },
      include: { student_learning_activity_attachments: true },
    });
    expect(untouched.status).toBe("NOT_SUBMITTED");
    expect(untouched.student_learning_activity_attachments).toEqual([]);
    expect(
      await listStoredObjects(
        `${course.section_id}/learning-activity/${learningActivity.id}/`,
      ),
    ).toEqual([]);
  });

  it("refuses a group the caller never joined", async () => {
    const leader = await createStudent();
    const outsider = await createStudent();
    const course = await createCourse();
    const learningActivity = await createLearningActivity({
      section_id: course.section_id,
    });
    const group = await createLearningActivityGroup({
      learning_activity_id: learningActivity.id,
      members: [{ student_id: leader.student_id, status: "ACCEPT" }],
    });
    const own = await createLearningSubmission({
      student_id: outsider.student_id,
      learning_activity_id: learningActivity.id,
      status: "NOT_SUBMITTED",
    });

    const response = await request(app)
      .post("/student/submit/learning-activity")
      .set("Cookie", sessionCookie({ userId: outsider.student_id }))
      .field("student_learning_activity_id", String(own.id))
      .field("section_id", String(course.section_id))
      .field("learning_activity_id", String(learningActivity.id))
      .field("type", "GROUP")
      .field("group_id", String(group.id));

    expect(response.status).toBe(403);
    expect(response.body.message).toBe(
      "ส่งงานกลุ่มได้เฉพาะกลุ่มที่ตัวเองเป็นสมาชิกเท่านั้น",
    );

    const submissions = await prisma.student_learning_activity.findMany({
      where: { learning_activity_id: learningActivity.id },
    });
    expect(submissions.map((s) => s.status)).toEqual(
      submissions.map(() => "NOT_SUBMITTED"),
    );
  });

  it("answers 400 for a type the endpoint does not have", async () => {
    // The column behind this is a plain VarChar, and the controller reads
    // anything that is not INDIVIDUAL as GROUP — so a misspelling used to take
    // the group path with no group behind it.
    const student = await createStudent();
    const course = await createCourse();
    const learningActivity = await createLearningActivity({
      section_id: course.section_id,
    });
    const submission = await createLearningSubmission({
      student_id: student.student_id,
      learning_activity_id: learningActivity.id,
      status: "NOT_SUBMITTED",
    });

    const response = await request(app)
      .post("/student/submit/learning-activity")
      .set("Cookie", sessionCookie({ userId: student.student_id }))
      .field("student_learning_activity_id", String(submission.id))
      .field("section_id", String(course.section_id))
      .field("learning_activity_id", String(learningActivity.id))
      .field("type", "SOLO");

    expect(response.status).toBe(400);
    expect(response.body.errors).toEqual([
      {
        field: "type",
        location: "body",
        message: "ต้องเป็นค่าใดค่าหนึ่งใน: INDIVIDUAL, GROUP",
      },
    ]);
    expect(
      (
        await prisma.student_learning_activity.findUniqueOrThrow({
          where: { id: submission.id },
        })
      ).status,
    ).toBe("NOT_SUBMITTED");
  });

  it("refuses a request with no session", async () => {
    const submission = await createLearningSubmission({
      status: "NOT_SUBMITTED",
    });

    const response = await request(app)
      .post("/student/submit/learning-activity")
      .field("student_learning_activity_id", String(submission.id))
      .field("type", "INDIVIDUAL");

    expect(response.status).toBe(401);
    expect(
      (
        await prisma.student_learning_activity.findUniqueOrThrow({
          where: { id: submission.id },
        })
      ).status,
    ).toBe("NOT_SUBMITTED");
  });

  it("refuses a teacher", async () => {
    const teacher = await createTeacher();
    const submission = await createLearningSubmission({
      status: "NOT_SUBMITTED",
    });

    const response = await request(app)
      .post("/student/submit/learning-activity")
      .set("Cookie", sessionCookie({ userId: teacher.user_id }))
      .field("student_learning_activity_id", String(submission.id))
      .field("type", "INDIVIDUAL");

    expect(response.status).toBe(403);
    expect(response.body).toEqual({
      success: false,
      message: "สิทธิ์การเข้าถึงเฉพาะนักศึกษาเท่านั้น",
    });
  });
});
