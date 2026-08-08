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
 * - The session decides who is submitting, but not *what*. student_activity_id
 *   comes from the body and nothing checks that it belongs to the caller — see
 *   the case that says so, and #31.
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
    // Only the join row goes. The attachment itself, and its object, stay.
    expect(
      await prisma.attachments.findUnique({
        where: { attachment_id: dropped.attachment_id },
      }),
    ).not.toBeNull();
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
      (await prisma.student_activity_group.findUniqueOrThrow({
        where: { id: group.id },
      })).status,
    ).toBe("SUBMITTED");

    // Uploaded once, under the group's path rather than any one student's.
    const objects = await listStoredObjects(
      `${course.section_id}/activity/${activity.id}/group-${group.id}`,
    );
    expect(objects).toHaveLength(1);
  });

  it("answers 500 for a group with nobody who accepted", async () => {
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

    expect(response.status).toBe(500);
    expect(response.body.message).toBe("Group has no accepted members");
    expect(
      (await prisma.student_activity.findUniqueOrThrow({
        where: { id: membership.student_activity_id! },
      })).status,
    ).toBe("NOT_SUBMITTED");
  });

  it("answers 500 for a student_activity_id that belongs to no submission", async () => {
    const student = await createStudent();
    const course = await createCourse();

    const response = await request(app)
      .post("/student/submit/activity")
      .set("Cookie", sessionCookie({ userId: student.student_id }))
      .field("student_activity_id", "999999")
      .field("section_id", String(course.section_id))
      .field("activity_id", "999999")
      .field("type", "INDIVIDUAL");

    expect(response.status).toBe(500);
    expect(response.body.message).toBe("Student activity not found");
  });

  it("submits somebody else's work when handed their submission id", async () => {
    // The session says who is asking; the body says what is being submitted,
    // and nothing checks that the two agree. A student who knows a classmate's
    // student_activity_id can hand their work in for them — and the classmate's
    // own attachments are replaced by whatever this request carries. #31.
    const student = await createStudent();
    const classmate = await createStudent();
    const course = await createCourse();
    const activity = await createActivity({ section_id: course.section_id });
    const theirs = await createSubmission({
      student_id: classmate.student_id,
      activity_id: activity.id,
      status: "NOT_SUBMITTED",
    });

    const response = await request(app)
      .post("/student/submit/activity")
      .set("Cookie", sessionCookie({ userId: student.student_id }))
      .field("student_activity_id", String(theirs.id))
      .field("section_id", String(course.section_id))
      .field("activity_id", String(activity.id))
      .field("type", "INDIVIDUAL");

    expect(response.status).toBe(200);
    expect(
      (await prisma.student_activity.findUniqueOrThrow({
        where: { id: theirs.id },
      })).status,
    ).toBe("SUBMITTED");
  });

  it("refuses a request with no session", async () => {
    const submission = await createSubmission({ status: "NOT_SUBMITTED" });

    const response = await request(app)
      .post("/student/submit/activity")
      .field("student_activity_id", String(submission.id))
      .field("type", "INDIVIDUAL");

    expect(response.status).toBe(401);
    expect(response.body).toEqual({
      message: "ไม่พบ Token หรือ Token หมดอายุ",
    });
    expect(
      (await prisma.student_activity.findUniqueOrThrow({
        where: { id: submission.id },
      })).status,
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
    const leaderMembership =
      group.student_learning_activity_group_member.find(
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

  it("answers 500 for an id that belongs to no submission", async () => {
    const student = await createStudent();
    const course = await createCourse();

    const response = await request(app)
      .post("/student/submit/learning-activity")
      .set("Cookie", sessionCookie({ userId: student.student_id }))
      .field("student_learning_activity_id", "999999")
      .field("section_id", String(course.section_id))
      .field("learning_activity_id", "999999")
      .field("type", "INDIVIDUAL");

    expect(response.status).toBe(500);
    expect(response.body.message).toBe("student_learning_activity not found");
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
      (await prisma.student_learning_activity.findUniqueOrThrow({
        where: { id: submission.id },
      })).status,
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
      message: "สิทธิ์การเข้าถึงเฉพาะนักศึกษาเท่านั้น",
    });
  });
});
