import { describe, expect, it } from "vitest";
import request from "supertest";
import app from "../src/app";
import prisma from "../src/config/prisma";
import {
  createCourse,
  createLearningActivity,
  createLearningActivityGroup,
  createStudent,
  createTeacher,
  enrolStudent,
} from "./factories";
import { sessionCookie } from "./helpers/session";

/**
 * Forming a group for classroom work — /student-learning-activity-group.
 *
 * The same five endpoints as /student-activity-group, written a second time
 * against the parallel learning-activity tables. They are close enough to their
 * twins that the interesting question is where they are *not* the same, so this
 * file states the behaviour in full rather than pointing at activity-group.test
 * — if one side is changed and the other is not, one of these files fails.
 *
 * Auth is arranged the same way: the two writing endpoints require a student
 * session, the three reads take the student they are about from the query
 * string and check nothing.
 */

/** A section with a learning activity and students enrolled — the state a group
 *  is formed from. */
async function classWithStudents(count: number) {
  const course = await createCourse();
  const learningActivity = await createLearningActivity({
    section_id: course.section_id,
    learning_activity_type: "group",
  });

  const students = [];
  for (let index = 0; index < count; index++) {
    const student = await createStudent();
    await enrolStudent(course.section_id, student.student_id);
    students.push(student);
  }

  return { course, learningActivity, students };
}

describe("POST /student-learning-activity-group", () => {
  it("creates the group, its members and a submission row for each", async () => {
    const { learningActivity, students } = await classWithStudents(2);
    const [leader, member] = students;

    const response = await request(app)
      .post("/student-learning-activity-group")
      .set("Cookie", sessionCookie({ userId: leader.student_id }))
      .send({
        learning_activity_id: learningActivity.id,
        members: [
          { student_id: leader.student_id, role: "LEADER" },
          { student_id: member.student_id, role: "MEMBER" },
        ],
      });

    expect(response.status).toBe(200);
    expect(response.body.data.group_id).toEqual(expect.any(Number));

    const group =
      await prisma.student_learning_activity_group.findUniqueOrThrow({
        where: { id: response.body.data.group_id },
        include: {
          student_learning_activity_group_member: { orderBy: { role: "asc" } },
        },
      });

    expect(group).toMatchObject({
      learning_activity_id: learningActivity.id,
      created_by: leader.student_id,
      status: "NOT_SUBMITTED",
    });

    // The leader is in from the start; everyone else has to answer first.
    expect(
      group.student_learning_activity_group_member.map((row) => [
        row.student_id,
        row.role,
        row.status,
      ]),
    ).toEqual([
      [leader.student_id, "LEADER", "ACCEPT"],
      [member.student_id, "MEMBER", "PENDING"],
    ]);

    const tokens = group.student_learning_activity_group_member.map(
      (row) => row.invite_token,
    );
    expect(tokens[0]).toBeNull();
    expect(tokens[1]).toEqual(expect.any(String));

    expect(
      await prisma.student_learning_activity.findMany({
        where: { learning_activity_id: learningActivity.id },
        select: { student_id: true, status: true },
        orderBy: { student_id: "asc" },
      }),
    ).toEqual(
      [
        { student_id: leader.student_id, status: "NOT_SUBMITTED" },
        { student_id: member.student_id, status: "NOT_SUBMITTED" },
      ].sort((a, b) => a.student_id.localeCompare(b.student_id)),
    );
  });

  it("reuses a submission row the student already had", async () => {
    const { learningActivity, students } = await classWithStudents(1);
    const [leader] = students;
    const existing = await prisma.student_learning_activity.create({
      data: {
        learning_activity_id: learningActivity.id,
        student_id: leader.student_id,
        status: "SUBMITTED",
      },
    });

    const response = await request(app)
      .post("/student-learning-activity-group")
      .set("Cookie", sessionCookie({ userId: leader.student_id }))
      .send({
        learning_activity_id: learningActivity.id,
        members: [{ student_id: leader.student_id, role: "LEADER" }],
      });

    expect(response.status).toBe(200);

    const member =
      await prisma.student_learning_activity_group_member.findFirstOrThrow({
        where: { group_id: response.body.data.group_id },
      });
    expect(member.student_learning_activity_id).toBe(existing.id);
    // Still SUBMITTED — forming a group must not undo work already handed in.
    expect(
      await prisma.student_learning_activity.findUniqueOrThrow({
        where: { id: existing.id },
      }),
    ).toMatchObject({ status: "SUBMITTED" });
  });

  it("refuses a request with no session", async () => {
    const { learningActivity, students } = await classWithStudents(1);

    const response = await request(app)
      .post("/student-learning-activity-group")
      .send({
        learning_activity_id: learningActivity.id,
        members: [{ student_id: students[0].student_id, role: "LEADER" }],
      });

    expect(response.status).toBe(401);
    expect(response.body).toEqual({
      message: "ไม่พบ Token หรือ Token หมดอายุ",
    });
    expect(
      await prisma.student_learning_activity_group.count({
        where: { learning_activity_id: learningActivity.id },
      }),
    ).toBe(0);
  });

  it("refuses a teacher", async () => {
    const { learningActivity, students } = await classWithStudents(1);
    const teacher = await createTeacher();

    const response = await request(app)
      .post("/student-learning-activity-group")
      .set("Cookie", sessionCookie({ userId: teacher.user_id }))
      .send({
        learning_activity_id: learningActivity.id,
        members: [{ student_id: students[0].student_id, role: "LEADER" }],
      });

    expect(response.status).toBe(403);
    expect(response.body).toEqual({
      message: "สิทธิ์การเข้าถึงเฉพาะนักศึกษาเท่านั้น",
    });
    expect(
      await prisma.student_learning_activity_group.count({
        where: { learning_activity_id: learningActivity.id },
      }),
    ).toBe(0);
  });

  it("refuses a request with no member list", async () => {
    const { learningActivity, students } = await classWithStudents(1);

    const response = await request(app)
      .post("/student-learning-activity-group")
      .set("Cookie", sessionCookie({ userId: students[0].student_id }))
      .send({ learning_activity_id: learningActivity.id });

    expect(response.status).toBe(500);
    expect(
      await prisma.student_learning_activity_group.count({
        where: { learning_activity_id: learningActivity.id },
      }),
    ).toBe(0);
  });

  it("refuses a member who is not a student in this system", async () => {
    const { learningActivity, students } = await classWithStudents(1);

    const response = await request(app)
      .post("/student-learning-activity-group")
      .set("Cookie", sessionCookie({ userId: students[0].student_id }))
      .send({
        learning_activity_id: learningActivity.id,
        members: [
          { student_id: students[0].student_id, role: "LEADER" },
          { student_id: "99999999", role: "MEMBER" },
        ],
      });

    expect(response.status).toBe(500);
    // One transaction, so the group the first member was written into is rolled
    // back with them.
    expect(
      await prisma.student_learning_activity_group.count({
        where: { learning_activity_id: learningActivity.id },
      }),
    ).toBe(0);
  });
});

describe("PATCH /student-learning-activity-group", () => {
  it("adds a member and keeps the answers the existing ones already gave", async () => {
    const { learningActivity, students } = await classWithStudents(3);
    const [leader, answered, added] = students;
    const group = await createLearningActivityGroup({
      learning_activity_id: learningActivity.id,
      members: [
        { student_id: leader.student_id },
        {
          student_id: answered.student_id,
          invite_token: "already-answered",
          status: "ACCEPT",
        },
      ],
    });

    const response = await request(app)
      .patch("/student-learning-activity-group")
      .set("Cookie", sessionCookie({ userId: leader.student_id }))
      .send({
        group_id: group.id,
        members: [
          { student_id: leader.student_id, role: "LEADER" },
          { student_id: answered.student_id, role: "MEMBER" },
          { student_id: added.student_id, role: "MEMBER" },
        ],
      });

    expect(response.status).toBe(200);
    expect(response.body.data).toEqual({ group_id: group.id });

    const members =
      await prisma.student_learning_activity_group_member.findMany({
        where: { group_id: group.id },
      });
    const byStudent = new Map(members.map((row) => [row.student_id, row]));

    // The member who already said yes keeps saying yes, and keeps the token
    // they were given — the rows are rewritten, but the answers carry over.
    expect(byStudent.get(answered.student_id)).toMatchObject({
      status: "ACCEPT",
      invite_token: "already-answered",
    });
    expect(byStudent.get(added.student_id)).toMatchObject({
      status: "PENDING",
    });
    expect(byStudent.get(added.student_id)?.invite_token).toEqual(
      expect.any(String),
    );
  });

  it("removes a member left out of the new list", async () => {
    const { learningActivity, students } = await classWithStudents(2);
    const [leader, dropped] = students;
    const group = await createLearningActivityGroup({
      learning_activity_id: learningActivity.id,
      members: [
        { student_id: leader.student_id },
        { student_id: dropped.student_id },
      ],
    });

    const response = await request(app)
      .patch("/student-learning-activity-group")
      .set("Cookie", sessionCookie({ userId: leader.student_id }))
      .send({
        group_id: group.id,
        members: [{ student_id: leader.student_id, role: "LEADER" }],
      });

    expect(response.status).toBe(200);
    expect(
      await prisma.student_learning_activity_group_member.findMany({
        where: { group_id: group.id },
      }),
    ).toHaveLength(1);

    // The submission row stays behind, as on the activity side: leaving a group
    // does not delete the work.
    expect(
      await prisma.student_learning_activity.findFirst({
        where: {
          learning_activity_id: learningActivity.id,
          student_id: dropped.student_id,
        },
      }),
    ).not.toBeNull();
  });

  it("refuses a request with no session", async () => {
    const group = await createLearningActivityGroup();

    const response = await request(app)
      .patch("/student-learning-activity-group")
      .send({ group_id: group.id, members: [] });

    expect(response.status).toBe(401);
    expect(
      await prisma.student_learning_activity_group_member.count({
        where: { group_id: group.id },
      }),
    ).toBe(2);
  });

  it("refuses a teacher", async () => {
    const group = await createLearningActivityGroup();
    const teacher = await createTeacher();

    const response = await request(app)
      .patch("/student-learning-activity-group")
      .set("Cookie", sessionCookie({ userId: teacher.user_id }))
      .send({ group_id: group.id, members: [] });

    expect(response.status).toBe(403);
    expect(
      await prisma.student_learning_activity_group_member.count({
        where: { group_id: group.id },
      }),
    ).toBe(2);
  });

  it("refuses a group that does not exist", async () => {
    const student = await createStudent();

    const response = await request(app)
      .patch("/student-learning-activity-group")
      .set("Cookie", sessionCookie({ userId: student.student_id }))
      .send({ group_id: 999_999, members: [] });

    expect(response.status).toBe(500);
  });

  it("empties the group when handed an empty member list", async () => {
    // Recorded, not endorsed, and identical on both sides: the members are
    // deleted first and then re-created from the list, so [] leaves the group
    // with nobody in it and no way back through the API. There is no LEADER
    // check either, so any member can do it. #27 refuses both.
    const group = await createLearningActivityGroup();
    const leader = group.student_learning_activity_group_member[0];

    const response = await request(app)
      .patch("/student-learning-activity-group")
      .set("Cookie", sessionCookie({ userId: leader.student_id }))
      .send({ group_id: group.id, members: [] });

    expect(response.status).toBe(200);
    expect(
      await prisma.student_learning_activity_group_member.count({
        where: { group_id: group.id },
      }),
    ).toBe(0);
  });
});

describe("GET /student-learning-activity-group", () => {
  it("returns the group the student is in for that learning activity", async () => {
    const { learningActivity, students } = await classWithStudents(2);
    const [leader, member] = students;
    const group = await createLearningActivityGroup({
      learning_activity_id: learningActivity.id,
      members: [
        { student_id: leader.student_id },
        { student_id: member.student_id },
      ],
    });

    const response = await request(app)
      .get("/student-learning-activity-group")
      .query({
        student_id: member.student_id,
        learning_activity_id: learningActivity.id,
      });

    expect(response.status).toBe(200);
    expect(response.body.data.group_id).toBe(group.id);
    expect(response.body.data.members).toEqual([
      {
        student_id: leader.student_id,
        role: "LEADER",
        student_name: leader.full_name_th,
        status: "ACCEPT",
      },
      {
        student_id: member.student_id,
        role: "MEMBER",
        student_name: member.full_name_th,
        status: "PENDING",
      },
    ]);
  });

  it("returns null when the student has no group for that learning activity", async () => {
    const { learningActivity, students } = await classWithStudents(1);

    const response = await request(app)
      .get("/student-learning-activity-group")
      .query({
        student_id: students[0].student_id,
        learning_activity_id: learningActivity.id,
      });

    expect(response.status).toBe(200);
    expect(response.body.data).toBeNull();
  });

  it("answers 500 when the learning_activity_id is missing", async () => {
    // parseInt(undefined) is NaN, which Prisma sends as null, and the column is
    // NOT NULL — so the query is rejected rather than matching nothing. #20
    // turns this into a 400, here and everywhere else it happens.
    const student = await createStudent();

    const response = await request(app)
      .get("/student-learning-activity-group")
      .query({ student_id: student.student_id });

    expect(response.status).toBe(500);
  });
});

describe("GET /student-learning-activity-group/all", () => {
  it("returns every group the student is in across the section", async () => {
    const { course, students } = await classWithStudents(3);
    const [student, ...partners] = students;
    const groups = [];
    // Different partners in each: two groups with the same member list are
    // collapsed into one, which the next case is about.
    for (const partner of partners) {
      const learningActivity = await createLearningActivity({
        section_id: course.section_id,
        learning_activity_type: "group",
      });
      groups.push(
        await createLearningActivityGroup({
          learning_activity_id: learningActivity.id,
          members: [
            { student_id: student.student_id },
            { student_id: partner.student_id },
          ],
        }),
      );
    }

    const response = await request(app)
      .get("/student-learning-activity-group/all")
      .query({
        student_id: student.student_id,
        section_id: course.section_id,
      });

    expect(response.status).toBe(200);
    expect(
      response.body.data.map((group: { group_id: number }) => group.group_id),
    ).toEqual(groups.map((group) => group.id));
  });

  it("collapses two groups with the same members into one", async () => {
    // Recorded, not endorsed, exactly as on the activity side: two learning
    // activities set for the same pair are two real groups, and the caller is
    // shown one of them with nothing in the response to tell them apart by.
    const { course, students } = await classWithStudents(2);
    const [leader, member] = students;
    for (let index = 0; index < 2; index++) {
      const learningActivity = await createLearningActivity({
        section_id: course.section_id,
        learning_activity_type: "group",
      });
      await createLearningActivityGroup({
        learning_activity_id: learningActivity.id,
        members: [
          { student_id: leader.student_id },
          { student_id: member.student_id },
        ],
      });
    }

    const response = await request(app)
      .get("/student-learning-activity-group/all")
      .query({
        student_id: leader.student_id,
        section_id: course.section_id,
      });

    expect(response.status).toBe(200);
    expect(response.body.data).toHaveLength(1);
  });

  it("returns an empty list for a section the student has no group in", async () => {
    const course = await createCourse();
    const student = await createStudent();

    const response = await request(app)
      .get("/student-learning-activity-group/all")
      .query({ student_id: student.student_id, section_id: course.section_id });

    expect(response.status).toBe(200);
    expect(response.body.data).toEqual([]);
  });

  it("shows every group in the section when the student_id is missing", async () => {
    // Recorded, not endorsed, and the same on both sides: `some: { student_id:
    // undefined }` is no filter at all rather than a filter matching nothing,
    // so dropping the parameter widens the answer from "my groups" to
    // "everyone's". #26 makes this a 400.
    const { course, learningActivity, students } = await classWithStudents(2);
    await createLearningActivityGroup({
      learning_activity_id: learningActivity.id,
      members: [
        { student_id: students[0].student_id },
        { student_id: students[1].student_id },
      ],
    });

    const response = await request(app)
      .get("/student-learning-activity-group/all")
      .query({ section_id: course.section_id });

    expect(response.status).toBe(200);
    expect(response.body.data).toHaveLength(1);
  });
});

describe("GET /student-learning-activity-group/without-group", () => {
  it("returns the enrolled students who are in no group for the learning activity", async () => {
    const { course, learningActivity, students } = await classWithStudents(3);
    const [leader, member, alone] = students;
    await createLearningActivityGroup({
      learning_activity_id: learningActivity.id,
      members: [
        { student_id: leader.student_id },
        { student_id: member.student_id },
      ],
    });

    const response = await request(app)
      .get("/student-learning-activity-group/without-group")
      .query({
        section_id: course.section_id,
        learning_activity_id: learningActivity.id,
      });

    expect(response.status).toBe(200);
    expect(response.body.data).toEqual([
      { student_id: alone.student_id, full_name_th: alone.full_name_th },
    ]);
  });

  it("counts an invited student who has not answered as being in a group", async () => {
    const { course, learningActivity, students } = await classWithStudents(2);
    await createLearningActivityGroup({
      learning_activity_id: learningActivity.id,
      members: [
        { student_id: students[0].student_id },
        { student_id: students[1].student_id, status: "PENDING" },
      ],
    });

    const response = await request(app)
      .get("/student-learning-activity-group/without-group")
      .query({
        section_id: course.section_id,
        learning_activity_id: learningActivity.id,
      });

    expect(response.status).toBe(200);
    expect(response.body.data).toEqual([]);
  });

  it("still lists a student who is grouped for a different learning activity", async () => {
    // This is the one place the two sides are written differently: the activity
    // side excludes a student by the group's activity_id, this one by the
    // activity of the member's own submission row. Both answer the same, and
    // this case is what says so.
    const { course, learningActivity, students } = await classWithStudents(2);
    const other = await createLearningActivity({
      section_id: course.section_id,
      learning_activity_type: "group",
    });
    await createLearningActivityGroup({
      learning_activity_id: other.id,
      members: [
        { student_id: students[0].student_id },
        { student_id: students[1].student_id },
      ],
    });

    const response = await request(app)
      .get("/student-learning-activity-group/without-group")
      .query({
        section_id: course.section_id,
        learning_activity_id: learningActivity.id,
      });

    expect(response.status).toBe(200);
    expect(
      response.body.data
        .map((row: { student_id: string }) => row.student_id)
        .sort(),
    ).toEqual(students.map((student) => student.student_id).sort());
  });

  it("returns an empty list when no one is enrolled in the section", async () => {
    const course = await createCourse();
    const learningActivity = await createLearningActivity({
      section_id: course.section_id,
    });

    const response = await request(app)
      .get("/student-learning-activity-group/without-group")
      .query({
        section_id: course.section_id,
        learning_activity_id: learningActivity.id,
      });

    expect(response.status).toBe(200);
    expect(response.body.data).toEqual([]);
  });

  it("answers 500 when the section_id is missing", async () => {
    // student_course.section_id is NOT NULL, so the NaN parseInt produces is
    // rejected rather than matching nothing. #20 turns this into a 400.
    const { learningActivity } = await classWithStudents(1);

    const response = await request(app)
      .get("/student-learning-activity-group/without-group")
      .query({ learning_activity_id: learningActivity.id });

    expect(response.status).toBe(500);
  });
});
