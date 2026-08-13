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
  enrolStudent,
} from "./factories";
import { sessionCookie } from "./helpers/session";
import { listStoredObjects } from "./helpers/storage";

/**
 * Handing work in — POST /student/submit/activity and its learning-activity
 * twin.
 *
 * These two are the only endpoints in the submission group that upload
 * anything, so the cases here look at the bucket as well as the database. A
 * submission is a multipart request carrying three separate things at once:
 * new files, pasted URLs, and the ids of attachments the student already had
 * and wants to keep. Everything not in that third list is dropped, which is
 * how re-submitting replaces the previous attempt rather than adding to it.
 *
 * The endpoints live on the student router rather than with the rest of the
 * submission group — they are covered here because what they do is submission,
 * not identity.
 */

const PDF = Buffer.from("%PDF-1.4 example\n");

/** Everything a student needs before they can hand anything in. */
async function individualCase() {
  const course = await createCourse();
  const student = await createStudent();
  await enrolStudent(course.section_id, student.student_id);
  const activity = await createActivity({
    section_id: course.section_id,
    activity_type: "individual",
  });
  const submission = await createSubmission({
    activity_id: activity.id,
    student_id: student.student_id,
    status: "NOT_SUBMITTED",
  });

  return { course, student, activity, submission };
}

/** The same, on the learning-activity side. */
async function learningCase() {
  const course = await createCourse();
  const student = await createStudent();
  await enrolStudent(course.section_id, student.student_id);
  const learningActivity = await createLearningActivity({
    section_id: course.section_id,
  });
  const submission = await createLearningSubmission({
    learning_activity_id: learningActivity.id,
    student_id: student.student_id,
    status: "NOT_SUBMITTED",
  });

  return { course, student, learningActivity, submission };
}

/** Uploads are keyed by section, so this is what a case counts within. */
function sectionPrefix(section_id: number): string {
  return `${section_id}/`;
}

describe("POST /student/submit/activity", () => {
  it("uploads the files, records them and marks the work submitted", async () => {
    const { course, student, activity, submission } = await individualCase();

    const response = await request(app)
      .post("/student/submit/activity")
      .set("Cookie", sessionCookie({ userId: student.student_id }))
      .field("student_activity_id", String(submission.id))
      .field("section_id", String(course.section_id))
      .field("activity_id", String(activity.id))
      .field("type", "INDIVIDUAL")
      .attach("files", PDF, "report.pdf");

    expect(response.status).toBe(200);
    expect(response.body.data).toMatchObject({ status: "SUBMITTED" });

    const submitted = await prisma.student_activity.findUniqueOrThrow({
      where: { id: submission.id },
    });
    expect(submitted.status).toBe("SUBMITTED");
    expect(submitted.submitted_at).not.toBeNull();

    // The object itself, under a key that says whose work it is.
    const stored = await listStoredObjects(sectionPrefix(course.section_id));
    expect(stored).toHaveLength(1);
    expect(stored[0]).toContain(
      `${course.section_id}/activity/${activity.id}/${student.student_id}/`,
    );
    expect(stored[0]).toContain("report.pdf");

    const attachments = await prisma.student_activity_attachments.findMany({
      where: { student_activity_id: submission.id },
      include: { attachments: true },
    });
    expect(attachments).toHaveLength(1);
    expect(attachments[0].attachments).toMatchObject({
      title: "report.pdf",
      attachment_type: "file",
      original_filename: "report.pdf",
      file_size: BigInt(PDF.length),
      file_type: "PDF",
      file_path: stored[0],
    });
  });

  it("records a pasted URL without uploading anything", async () => {
    const { course, student, activity, submission } = await individualCase();

    const response = await request(app)
      .post("/student/submit/activity")
      .set("Cookie", sessionCookie({ userId: student.student_id }))
      .field("student_activity_id", String(submission.id))
      .field("section_id", String(course.section_id))
      .field("activity_id", String(activity.id))
      .field("type", "INDIVIDUAL")
      .field(
        "urls",
        JSON.stringify([
          { title: "งานบน Google Drive", url: "https://example.test/work" },
        ]),
      );

    expect(response.status).toBe(200);
    expect(await listStoredObjects(sectionPrefix(course.section_id))).toEqual(
      [],
    );

    const attachments = await prisma.student_activity_attachments.findMany({
      where: { student_activity_id: submission.id },
      include: { attachments: true },
    });
    expect(attachments).toHaveLength(1);
    expect(attachments[0].attachments).toMatchObject({
      title: "งานบน Google Drive",
      attachment_type: "link",
      url: "https://example.test/work",
      file_path: null,
    });
  });

  it("keeps only the attachments named in existing_files_ids", async () => {
    const { course, student, activity, submission } = await individualCase();
    const kept = await createFileAttachment({ original_filename: "เก่า.pdf" });
    const dropped = await createFileAttachment({
      original_filename: "ทิ้ง.pdf",
    });
    await prisma.student_activity_attachments.createMany({
      data: [kept, dropped].map((attachment) => ({
        student_activity_id: submission.id,
        attachment_id: attachment.attachment_id,
      })),
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
    expect(
      await prisma.student_activity_attachments.findMany({
        where: { student_activity_id: submission.id },
        select: { attachment_id: true },
      }),
    ).toEqual([{ attachment_id: kept.attachment_id }]);

    // The submission was the only thing pointing at the dropped file, so it
    // goes with the link rather than being left where nothing can reach it
    // (#34). What existing_files_ids named is linked back in the same
    // transaction, so the sweep never sees it unreferenced.
    expect(
      await prisma.attachments.count({
        where: { attachment_id: dropped.attachment_id },
      }),
    ).toBe(0);
    expect(
      await prisma.attachments.count({
        where: { attachment_id: kept.attachment_id },
      }),
    ).toBe(1);
  });

  it("gives one upload to every accepted member of a group", async () => {
    const course = await createCourse();
    const activity = await createActivity({
      section_id: course.section_id,
      activity_type: "group",
    });
    const leader = await createStudent();
    const member = await createStudent();
    const group = await createActivityGroup({
      activity_id: activity.id,
      members: [
        { student_id: leader.student_id },
        { student_id: member.student_id, status: "ACCEPT" },
      ],
    });
    const leaderSubmission = group.student_activity_group_member[0];

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
      .attach("files", PDF, "group-report.pdf");

    expect(response.status).toBe(200);

    // Uploaded once, under the group's key rather than any one student's.
    const stored = await listStoredObjects(sectionPrefix(course.section_id));
    expect(stored).toHaveLength(1);
    expect(stored[0]).toContain(
      `${course.section_id}/activity/${activity.id}/group-${group.id}/`,
    );

    // But recorded against everyone, so each member sees the group's work on
    // their own submission.
    expect(
      await prisma.student_activity.findMany({
        where: { activity_id: activity.id },
        select: { status: true },
      }),
    ).toEqual([{ status: "SUBMITTED" }, { status: "SUBMITTED" }]);
    expect(
      await prisma.student_activity_attachments.findMany({
        where: { student_activity: { activity_id: activity.id } },
      }),
    ).toHaveLength(2);
    expect(
      await prisma.student_activity_group.findUniqueOrThrow({
        where: { id: group.id },
      }),
    ).toMatchObject({ status: "SUBMITTED" });
  });

  it("leaves a member who never accepted out of the group submission", async () => {
    const course = await createCourse();
    const activity = await createActivity({
      section_id: course.section_id,
      activity_type: "group",
    });
    const group = await createActivityGroup({ activity_id: activity.id });
    const [leader, pending] = group.student_activity_group_member;

    const response = await request(app)
      .post("/student/submit/activity")
      .set("Cookie", sessionCookie({ userId: leader.student_id }))
      .field("student_activity_id", String(leader.student_activity_id))
      .field("section_id", String(course.section_id))
      .field("activity_id", String(activity.id))
      .field("type", "GROUP")
      .field("group_id", String(group.id))
      .attach("files", PDF, "group-report.pdf");

    expect(response.status).toBe(200);
    expect(
      await prisma.student_activity.findUniqueOrThrow({
        where: { id: pending.student_activity_id },
      }),
    ).toMatchObject({ status: "NOT_SUBMITTED" });
  });

  it("refuses a group submission nobody has accepted", async () => {
    // Both members are still PENDING, so there is no group to submit for. That
    // is the caller's state rather than the server breaking, and it answered
    // 500 with an English sentence until #20.
    const course = await createCourse();
    const activity = await createActivity({
      section_id: course.section_id,
      activity_type: "group",
    });
    const group = await createActivityGroup({
      activity_id: activity.id,
      members: [{ role: "MEMBER" }, { role: "MEMBER" }],
    });
    const [first] = group.student_activity_group_member;

    const response = await request(app)
      .post("/student/submit/activity")
      .set("Cookie", sessionCookie({ userId: first.student_id }))
      .field("student_activity_id", String(first.student_activity_id))
      .field("section_id", String(course.section_id))
      .field("activity_id", String(activity.id))
      .field("type", "GROUP")
      .field("group_id", String(group.id))
      .attach("files", PDF, "group-report.pdf");

    expect(response.status).toBe(400);
    expect(response.body.message).toBe(
      "ยังไม่มีสมาชิกที่ตอบรับคำเชิญในกลุ่มนี้",
    );
    expect(
      await prisma.student_activity.findUniqueOrThrow({
        where: { id: first.student_activity_id },
      }),
    ).toMatchObject({ status: "NOT_SUBMITTED" });
  });

  it("refuses a submission row that does not exist, uploading nothing", async () => {
    const { course, student, activity } = await individualCase();

    const response = await request(app)
      .post("/student/submit/activity")
      .set("Cookie", sessionCookie({ userId: student.student_id }))
      .field("student_activity_id", "999999")
      .field("section_id", String(course.section_id))
      .field("activity_id", String(activity.id))
      .field("type", "INDIVIDUAL")
      .attach("files", PDF, "report.pdf");

    // A well-formed id that names no row: 404 since #20, where it used to be a
    // 500 carrying "Student activity not found".
    expect(response.status).toBe(404);
    expect(response.body.message).toBe("ไม่พบงานที่ต้องการส่ง");
    // The upload happens inside the transaction, after the submission has been
    // found, so nothing reaches the bucket either.
    expect(await listStoredObjects(sectionPrefix(course.section_id))).toEqual(
      [],
    );
  });

  it("refuses a request with no session", async () => {
    const { course, activity, submission } = await individualCase();

    const response = await request(app)
      .post("/student/submit/activity")
      .field("student_activity_id", String(submission.id))
      .field("section_id", String(course.section_id))
      .field("activity_id", String(activity.id))
      .field("type", "INDIVIDUAL")
      .attach("files", PDF, "report.pdf");

    expect(response.status).toBe(401);
    expect(response.body).toEqual({
      success: false,
      message: "ไม่พบ Token หรือ Token หมดอายุ",
    });
    expect(
      await prisma.student_activity.findUniqueOrThrow({
        where: { id: submission.id },
      }),
    ).toMatchObject({ status: "NOT_SUBMITTED" });
  });

  it("stores nothing in the bucket when the caller is refused", async () => {
    // The upload middleware used to be registered ahead of the role check, so
    // a teacher's request was buffered in full before being told 403. See
    // BEHAVIOR-CHANGES.md.
    const { course, activity, submission } = await individualCase();
    const teacher = await createTeacher();

    const response = await request(app)
      .post("/student/submit/activity")
      .set("Cookie", sessionCookie({ userId: teacher.user_id }))
      .field("student_activity_id", String(submission.id))
      .field("section_id", String(course.section_id))
      .field("activity_id", String(activity.id))
      .field("type", "INDIVIDUAL")
      .attach("files", PDF, "report.pdf");

    expect(response.status).toBe(403);
    expect(response.body).toEqual({
      success: false,
      message: "สิทธิ์การเข้าถึงเฉพาะนักศึกษาเท่านั้น",
    });
    expect(await listStoredObjects(sectionPrefix(course.section_id))).toEqual(
      [],
    );
    expect(
      await prisma.student_activity.findUniqueOrThrow({
        where: { id: submission.id },
      }),
    ).toMatchObject({ status: "NOT_SUBMITTED" });
  });
});

describe("POST /student/submit/learning-activity", () => {
  it("uploads the files, records them and marks the work submitted", async () => {
    const { course, student, learningActivity, submission } =
      await learningCase();

    const response = await request(app)
      .post("/student/submit/learning-activity")
      .set("Cookie", sessionCookie({ userId: student.student_id }))
      .field("student_learning_activity_id", String(submission.id))
      .field("section_id", String(course.section_id))
      .field("learning_activity_id", String(learningActivity.id))
      .field("type", "INDIVIDUAL")
      .attach("files", PDF, "worksheet.pdf");

    expect(response.status).toBe(200);
    expect(
      await prisma.student_learning_activity.findUniqueOrThrow({
        where: { id: submission.id },
      }),
    ).toMatchObject({ status: "SUBMITTED" });

    const stored = await listStoredObjects(sectionPrefix(course.section_id));
    expect(stored).toHaveLength(1);
    expect(stored[0]).toContain(
      `${course.section_id}/learning-activity/${learningActivity.id}/${student.student_id}/`,
    );

    expect(
      await prisma.student_learning_activity_attachments.findMany({
        where: { student_learning_activity_id: submission.id },
      }),
    ).toHaveLength(1);
  });

  it("gives one upload to every accepted member of a group", async () => {
    const course = await createCourse();
    const learningActivity = await createLearningActivity({
      section_id: course.section_id,
      learning_activity_type: "group",
    });
    const leader = await createStudent();
    const member = await createStudent();
    const group = await createLearningActivityGroup({
      learning_activity_id: learningActivity.id,
      members: [
        { student_id: leader.student_id },
        { student_id: member.student_id, status: "ACCEPT" },
      ],
    });
    const leaderMember = group.student_learning_activity_group_member[0];

    const response = await request(app)
      .post("/student/submit/learning-activity")
      .set("Cookie", sessionCookie({ userId: leader.student_id }))
      .field(
        "student_learning_activity_id",
        String(leaderMember.student_learning_activity_id),
      )
      .field("section_id", String(course.section_id))
      .field("learning_activity_id", String(learningActivity.id))
      .field("type", "GROUP")
      .field("group_id", String(group.id))
      .attach("files", PDF, "group-worksheet.pdf");

    expect(response.status).toBe(200);

    const stored = await listStoredObjects(sectionPrefix(course.section_id));
    expect(stored).toHaveLength(1);
    expect(stored[0]).toContain(
      `${course.section_id}/learning-activity/${learningActivity.id}/group-${group.id}/`,
    );

    expect(
      await prisma.student_learning_activity.findMany({
        where: { learning_activity_id: learningActivity.id },
        select: { status: true },
      }),
    ).toEqual([{ status: "SUBMITTED" }, { status: "SUBMITTED" }]);
    expect(
      await prisma.student_learning_activity_group.findUniqueOrThrow({
        where: { id: group.id },
      }),
    ).toMatchObject({ status: "SUBMITTED" });
  });

  it("refuses a submission row that does not exist, uploading nothing", async () => {
    const { course, student, learningActivity } = await learningCase();

    const response = await request(app)
      .post("/student/submit/learning-activity")
      .set("Cookie", sessionCookie({ userId: student.student_id }))
      .field("student_learning_activity_id", "999999")
      .field("section_id", String(course.section_id))
      .field("learning_activity_id", String(learningActivity.id))
      .field("type", "INDIVIDUAL")
      .attach("files", PDF, "worksheet.pdf");

    // As on the activity side above: 404 since #20, not 500.
    expect(response.status).toBe(404);
    expect(response.body.message).toBe("ไม่พบงานที่ต้องการส่ง");
    expect(await listStoredObjects(sectionPrefix(course.section_id))).toEqual(
      [],
    );
  });

  it("refuses a request with no session", async () => {
    const submission = await createLearningSubmission({
      status: "NOT_SUBMITTED",
    });

    const response = await request(app)
      .post("/student/submit/learning-activity")
      .field("student_learning_activity_id", String(submission.id))
      .field("type", "INDIVIDUAL")
      .attach("files", PDF, "worksheet.pdf");

    expect(response.status).toBe(401);
    expect(
      await prisma.student_learning_activity.findUniqueOrThrow({
        where: { id: submission.id },
      }),
    ).toMatchObject({ status: "NOT_SUBMITTED" });
  });

  it("stores nothing in the bucket when the caller is refused", async () => {
    const { course, learningActivity, submission } = await learningCase();
    const teacher = await createTeacher();

    const response = await request(app)
      .post("/student/submit/learning-activity")
      .set("Cookie", sessionCookie({ userId: teacher.user_id }))
      .field("student_learning_activity_id", String(submission.id))
      .field("section_id", String(course.section_id))
      .field("learning_activity_id", String(learningActivity.id))
      .field("type", "INDIVIDUAL")
      .attach("files", PDF, "worksheet.pdf");

    expect(response.status).toBe(403);
    expect(response.body).toEqual({
      success: false,
      message: "สิทธิ์การเข้าถึงเฉพาะนักศึกษาเท่านั้น",
    });
    expect(await listStoredObjects(sectionPrefix(course.section_id))).toEqual(
      [],
    );
  });
});
