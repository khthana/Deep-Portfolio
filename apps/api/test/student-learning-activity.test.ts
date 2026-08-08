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
    const group = await createLearningActivityGroup();
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

  it("marks a PENDING member graded along with the rest", async () => {
    // Recorded, not endorsed. The group path collects members by group_id and
    // nothing else, so someone who never accepted the invitation is graded for
    // work they were never in the group for.
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
        where: { id: invited.student_learning_activity_id },
      }),
    ).toMatchObject({ status: "GRADED" });
  });

  it("refuses to grade a group submission that is not in a group", async () => {
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

    expect(response.status).toBe(500);
    expect(
      await prisma.student_learning_activity.findUniqueOrThrow({
        where: { id: submission.id },
      }),
    ).toMatchObject({ status: "SUBMITTED" });
  });

  it("refuses a submission that does not exist", async () => {
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

    expect(response.status).toBe(500);
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

  it("refuses a submission that does not exist", async () => {
    const teacher = await createTeacher();

    const response = await request(app)
      .patch("/student-learning-activity/bookmark")
      .set("Cookie", sessionCookie({ userId: teacher.user_id }))
      .send({
        activity_type: "INDIVIDUAL",
        student_learning_activity_id: 999_999,
        is_bookmark: true,
      });

    expect(response.status).toBe(500);
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
      message: "สิทธิ์การเข้าถึงเฉพาะอาจารย์เท่านั้น",
    });
    expect(
      await prisma.student_learning_activity.findUniqueOrThrow({
        where: { id: submission.id },
      }),
    ).toMatchObject({ is_bookmark: false });
  });
});
