import { describe, expect, it } from "vitest";
import request from "supertest";
import app from "../src/app";
import prisma from "../src/config/prisma";
import {
  createLearningActivityGroup,
  createLearningSubmission,
  createStudent,
  createTeacher,
} from "./factories";
import { sessionCookie } from "./helpers/session";

/**
 * Marking classroom work — /student-learning-activity.
 *
 * The same two teacher-only endpoints as /student-activity, and the same
 * INDIVIDUAL/GROUP split on `activity_type` in the body, but with much less
 * behind them: `student_learning_activity` has no score column and no rubric,
 * so grading here means writing feedback and moving the status to GRADED.
 * Nothing is computed and nothing reaches the CLOs.
 */

describe("POST /student-learning-activity/grade", () => {
  it("marks an individual submission graded with the feedback given", async () => {
    const teacher = await createTeacher();
    const submission = await createLearningSubmission();

    const response = await request(app)
      .post("/student-learning-activity/grade")
      .set("Cookie", sessionCookie({ userId: teacher.user_id }))
      .send({
        activity_type: "INDIVIDUAL",
        student_learning_activity_id: submission.id,
        feedback: "เข้าร่วมครบถ้วน",
        remark: "ตรวจแล้ว",
      });

    expect(response.status).toBe(200);

    const graded = await prisma.student_learning_activity.findUniqueOrThrow({
      where: { id: submission.id },
    });
    expect(graded).toMatchObject({
      status: "GRADED",
      feedback: "เข้าร่วมครบถ้วน",
      remark: "ตรวจแล้ว",
    });
    expect(graded.graded_at).not.toBeNull();
  });

  it("marks every member of a group graded at once", async () => {
    const teacher = await createTeacher();
    const group = await createLearningActivityGroup({
      members: [{}, { status: "ACCEPT" }],
    });
    const [leader, member] = group.student_learning_activity_group_member;

    const response = await request(app)
      .post("/student-learning-activity/grade")
      .set("Cookie", sessionCookie({ userId: teacher.user_id }))
      .send({
        activity_type: "GROUP",
        student_learning_activity_id: leader.student_learning_activity_id,
        feedback: "งานกลุ่มเรียบร้อย",
        remark: "",
      });

    expect(response.status).toBe(200);
    expect(response.body.data).toEqual({
      student_learning_activity_id: leader.student_learning_activity_id,
    });

    expect(
      await prisma.student_learning_activity.findMany({
        where: {
          id: {
            in: [
              leader.student_learning_activity_id,
              member.student_learning_activity_id,
            ],
          },
        },
        select: { status: true, feedback: true },
      }),
    ).toEqual([
      { status: "GRADED", feedback: "งานกลุ่มเรียบร้อย" },
      { status: "GRADED", feedback: "งานกลุ่มเรียบร้อย" },
    ]);

    // Marking the work marks the group, so the class list shows it done.
    expect(
      await prisma.student_learning_activity_group.findUniqueOrThrow({
        where: { id: group.id },
      }),
    ).toMatchObject({ status: "GRADED" });
  });

  it("passes over a member who never answered the invitation", async () => {
    // The same rule as the activity side, and for the same reason: handing the
    // work in only ever covered the members who accepted, so marking has no
    // business reaching further than that (#45, ADR-0017).
    const teacher = await createTeacher();
    const group = await createLearningActivityGroup();
    const [leader, invited] = group.student_learning_activity_group_member;
    expect(invited.status).toBe("PENDING");

    const response = await request(app)
      .post("/student-learning-activity/grade")
      .set("Cookie", sessionCookie({ userId: teacher.user_id }))
      .send({
        activity_type: "GROUP",
        student_learning_activity_id: leader.student_learning_activity_id,
        feedback: "",
        remark: "",
      });

    expect(response.status).toBe(200);
    expect(
      await prisma.student_learning_activity.findUniqueOrThrow({
        where: { id: leader.student_learning_activity_id },
      }),
    ).toMatchObject({ status: "GRADED" });
    expect(
      await prisma.student_learning_activity.findUniqueOrThrow({
        where: { id: invited.student_learning_activity_id },
      }),
    ).toMatchObject({ status: "NOT_SUBMITTED", graded_at: null });
  });

  it("refuses to grade a group submission that is not in a group", async () => {
    // 400 since #56, for the reason the same case gives in
    // student-activity.test.ts: the row of a student in no group is on the
    // teacher's marking table now, and its only link comes here.
    const teacher = await createTeacher();
    const submission = await createLearningSubmission();

    const response = await request(app)
      .post("/student-learning-activity/grade")
      .set("Cookie", sessionCookie({ userId: teacher.user_id }))
      .send({
        activity_type: "GROUP",
        student_learning_activity_id: submission.id,
        feedback: "",
        remark: "",
      });

    expect(response.status).toBe(400);
    expect(response.body).toEqual({
      success: false,
      message: "นักศึกษาคนนี้ยังไม่ได้อยู่ในกลุ่มใด จึงยังให้คะแนนงานกลุ่มไม่ได้",
    });
    expect(
      await prisma.student_learning_activity.findUniqueOrThrow({
        where: { id: submission.id },
      }),
    ).toMatchObject({ status: "SUBMITTED" });
  });

  it("answers 404 for a submission that does not exist", async () => {
    const teacher = await createTeacher();

    const response = await request(app)
      .post("/student-learning-activity/grade")
      .set("Cookie", sessionCookie({ userId: teacher.user_id }))
      .send({
        activity_type: "INDIVIDUAL",
        student_learning_activity_id: 999_999,
        feedback: "",
        remark: "",
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

  it("answers 400 when the request names no submission", async () => {
    const teacher = await createTeacher();

    const response = await request(app)
      .post("/student-learning-activity/grade")
      .set("Cookie", sessionCookie({ userId: teacher.user_id }))
      .send({ activity_type: "INDIVIDUAL", feedback: "ดีมาก" });

    expect(response.status).toBe(400);
    expect(response.body).toEqual({
      success: false,
      message: "ข้อมูลที่ส่งมาไม่ถูกต้อง: student_learning_activity_id ต้องระบุ",
      errors: [
        {
          field: "student_learning_activity_id",
          location: "body",
          message: "ต้องระบุ",
        },
      ],
    });
  });

  it("answers 400 for a kind of work it does not have", async () => {
    // Anything that was not INDIVIDUAL used to be treated as group work, so a
    // typo marked the submission through the group path and failed there.
    const teacher = await createTeacher();
    const submission = await createLearningSubmission();

    const response = await request(app)
      .post("/student-learning-activity/grade")
      .set("Cookie", sessionCookie({ userId: teacher.user_id }))
      .send({
        activity_type: "PAIR",
        student_learning_activity_id: submission.id,
        feedback: "",
        remark: "",
      });

    expect(response.status).toBe(400);
    expect(response.body.errors).toEqual([
      {
        field: "activity_type",
        location: "body",
        message: "ต้องเป็นค่าใดค่าหนึ่งใน: INDIVIDUAL, GROUP",
      },
    ]);
    expect(
      await prisma.student_learning_activity.findUniqueOrThrow({
        where: { id: submission.id },
      }),
    ).toMatchObject({ status: "SUBMITTED" });
  });

  it("refuses a request with no session", async () => {
    const submission = await createLearningSubmission();

    const response = await request(app)
      .post("/student-learning-activity/grade")
      .send({
        activity_type: "INDIVIDUAL",
        student_learning_activity_id: submission.id,
        feedback: "",
        remark: "",
      });

    expect(response.status).toBe(401);
    expect(response.body).toEqual({
      success: false,
      message: "ไม่พบ Token หรือ Token หมดอายุ",
    });
    expect(
      await prisma.student_learning_activity.findUniqueOrThrow({
        where: { id: submission.id },
      }),
    ).toMatchObject({ status: "SUBMITTED" });
  });

  it("refuses a student marking their own work", async () => {
    const student = await createStudent();
    const submission = await createLearningSubmission({
      student_id: student.student_id,
    });

    const response = await request(app)
      .post("/student-learning-activity/grade")
      .set("Cookie", sessionCookie({ userId: student.student_id }))
      .send({
        activity_type: "INDIVIDUAL",
        student_learning_activity_id: submission.id,
        feedback: "",
        remark: "",
      });

    expect(response.status).toBe(403);
    expect(response.body).toEqual({
      success: false,
      message: "สิทธิ์การเข้าถึงเฉพาะอาจารย์เท่านั้น",
    });
    expect(
      await prisma.student_learning_activity.findUniqueOrThrow({
        where: { id: submission.id },
      }),
    ).toMatchObject({ status: "SUBMITTED" });
  });
});

describe("PATCH /student-learning-activity/bookmark", () => {
  it("bookmarks an individual submission", async () => {
    const teacher = await createTeacher();
    const submission = await createLearningSubmission();

    const response = await request(app)
      .patch("/student-learning-activity/bookmark")
      .set("Cookie", sessionCookie({ userId: teacher.user_id }))
      .send({
        activity_type: "INDIVIDUAL",
        student_learning_activity_id: submission.id,
        is_bookmark: true,
      });

    expect(response.status).toBe(200);
    expect(response.body.data).toEqual({ is_bookmark: true });
    expect(
      await prisma.student_learning_activity.findUniqueOrThrow({
        where: { id: submission.id },
      }),
    ).toMatchObject({ is_bookmark: true });
  });

  it("bookmarks every member's submission for group work", async () => {
    const teacher = await createTeacher();
    const group = await createLearningActivityGroup();
    const [leader, member] = group.student_learning_activity_group_member;

    const response = await request(app)
      .patch("/student-learning-activity/bookmark")
      .set("Cookie", sessionCookie({ userId: teacher.user_id }))
      .send({
        activity_type: "GROUP",
        student_learning_activity_id: leader.student_learning_activity_id,
        is_bookmark: true,
      });

    expect(response.status).toBe(200);
    expect(
      await prisma.student_learning_activity.findMany({
        where: {
          id: {
            in: [
              leader.student_learning_activity_id,
              member.student_learning_activity_id,
            ],
          },
        },
        select: { is_bookmark: true },
      }),
    ).toEqual([{ is_bookmark: true }, { is_bookmark: true }]);
  });

  it("refuses to bookmark group work for a student who is in no group", async () => {
    // The other half of the same #56 row, for the reason the same case gives in
    // student-activity.test.ts.
    const teacher = await createTeacher();
    const submission = await createLearningSubmission();

    const response = await request(app)
      .patch("/student-learning-activity/bookmark")
      .set("Cookie", sessionCookie({ userId: teacher.user_id }))
      .send({
        activity_type: "GROUP",
        student_learning_activity_id: submission.id,
        is_bookmark: true,
      });

    expect(response.status).toBe(400);
    expect(response.body).toEqual({
      success: false,
      message: "นักศึกษาคนนี้ยังไม่ได้อยู่ในกลุ่มใด จึงบันทึกงานกลุ่มไม่ได้",
    });
    expect(
      await prisma.student_learning_activity.findUniqueOrThrow({
        where: { id: submission.id },
      }),
    ).toMatchObject({ is_bookmark: false });
  });

  it("answers 404 for a submission that does not exist", async () => {
    const teacher = await createTeacher();

    const response = await request(app)
      .patch("/student-learning-activity/bookmark")
      .set("Cookie", sessionCookie({ userId: teacher.user_id }))
      .send({
        activity_type: "INDIVIDUAL",
        student_learning_activity_id: 999_999,
        is_bookmark: true,
      });

    expect(response.status).toBe(404);
    expect(response.body).toEqual({
      success: false,
      message: "ไม่พบข้อมูลที่ต้องการ",
    });
  });

  it("answers 400 when the request does not say which way to set it", async () => {
    const teacher = await createTeacher();
    const submission = await createLearningSubmission({ is_bookmark: true });

    const response = await request(app)
      .patch("/student-learning-activity/bookmark")
      .set("Cookie", sessionCookie({ userId: teacher.user_id }))
      .send({
        activity_type: "INDIVIDUAL",
        student_learning_activity_id: submission.id,
      });

    expect(response.status).toBe(400);
    expect(response.body.errors).toEqual([
      { field: "is_bookmark", location: "body", message: "ต้องระบุ" },
    ]);
    expect(
      await prisma.student_learning_activity.findUniqueOrThrow({
        where: { id: submission.id },
      }),
    ).toMatchObject({ is_bookmark: true });
  });

  it("refuses a request with no session", async () => {
    const submission = await createLearningSubmission();

    const response = await request(app)
      .patch("/student-learning-activity/bookmark")
      .send({
        activity_type: "INDIVIDUAL",
        student_learning_activity_id: submission.id,
        is_bookmark: true,
      });

    expect(response.status).toBe(401);
    expect(
      await prisma.student_learning_activity.findUniqueOrThrow({
        where: { id: submission.id },
      }),
    ).toMatchObject({ is_bookmark: false });
  });

  it("refuses a student", async () => {
    const student = await createStudent();
    const submission = await createLearningSubmission({
      student_id: student.student_id,
    });

    const response = await request(app)
      .patch("/student-learning-activity/bookmark")
      .set("Cookie", sessionCookie({ userId: student.student_id }))
      .send({
        activity_type: "INDIVIDUAL",
        student_learning_activity_id: submission.id,
        is_bookmark: true,
      });

    expect(response.status).toBe(403);
    expect(response.body).toEqual({
      success: false,
      message: "สิทธิ์การเข้าถึงเฉพาะอาจารย์เท่านั้น",
    });
    expect(
      await prisma.student_learning_activity.findUniqueOrThrow({
        where: { id: submission.id },
      }),
    ).toMatchObject({ is_bookmark: false });
  });
});
