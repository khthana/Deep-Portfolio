import { describe, expect, it } from "vitest";
import request from "supertest";
import app from "../src/app";
import prisma from "../src/config/prisma";
import {
  createActivity,
  createActivityGroup,
  createCourse,
  createStudent,
  createTeacher,
  enrolStudent,
} from "./factories";
import { sessionCookie } from "./helpers/session";

/**
 * Forming a group for a piece of graded work — /student-activity-group.
 *
 * Students build their own groups here: the leader picks who is in it, and
 * everyone else is invited by email and stays PENDING until they answer (see
 * group-invite.test.ts). Creating the group also creates each member's
 * submission row, which is what makes the group a thing that can be handed in
 * and marked as one.
 *
 * Only the two writing endpoints check a session. The three reads take the
 * student they are about from the query string, so any caller can ask about
 * any student — recorded here as it is, because there is no ownership check
 * anywhere in this system to make it consistent with.
 */

/** A section with an activity and students already enrolled — the state a
 *  group is formed from. */
async function classWithStudents(count: number) {
  const course = await createCourse();
  const activity = await createActivity({
    section_id: course.section_id,
    activity_type: "group",
  });

  const students = [];
  for (let index = 0; index < count; index++) {
    const student = await createStudent();
    await enrolStudent(course.section_id, student.student_id);
    students.push(student);
  }

  return { course, activity, students };
}

describe("POST /student-activity-group", () => {
  it("creates the group, its members and a submission row for each", async () => {
    const { activity, students } = await classWithStudents(2);
    const [leader, member] = students;

    const response = await request(app)
      .post("/student-activity-group")
      .set("Cookie", sessionCookie({ userId: leader.student_id }))
      .send({
        activity_id: activity.id,
        members: [
          { student_id: leader.student_id, role: "LEADER" },
          { student_id: member.student_id, role: "MEMBER" },
        ],
      });

    expect(response.status).toBe(200);
    expect(response.body.data.group_id).toEqual(expect.any(Number));

    const group = await prisma.student_activity_group.findUniqueOrThrow({
      where: { id: response.body.data.group_id },
      include: {
        student_activity_group_member: { orderBy: { role: "asc" } },
      },
    });

    expect(group).toMatchObject({
      activity_id: activity.id,
      created_by: leader.student_id,
      status: "NOT_SUBMITTED",
    });

    // The leader is in from the start; everyone else has to answer first.
    expect(
      group.student_activity_group_member.map((row) => [
        row.student_id,
        row.role,
        row.status,
      ]),
    ).toEqual([
      [leader.student_id, "LEADER", "ACCEPT"],
      [member.student_id, "MEMBER", "PENDING"],
    ]);

    // And an invite token exists for exactly the people who need one.
    const tokens = group.student_activity_group_member.map(
      (row) => row.invite_token,
    );
    expect(tokens[0]).toBeNull();
    expect(tokens[1]).toEqual(expect.any(String));

    expect(
      await prisma.student_activity.findMany({
        where: { activity_id: activity.id },
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
    const { activity, students } = await classWithStudents(1);
    const [leader] = students;
    const existing = await prisma.student_activity.create({
      data: {
        activity_id: activity.id,
        student_id: leader.student_id,
        status: "SUBMITTED",
      },
    });

    const response = await request(app)
      .post("/student-activity-group")
      .set("Cookie", sessionCookie({ userId: leader.student_id }))
      .send({
        activity_id: activity.id,
        members: [{ student_id: leader.student_id, role: "LEADER" }],
      });

    expect(response.status).toBe(200);

    const member = await prisma.student_activity_group_member.findFirstOrThrow({
      where: { group_id: response.body.data.group_id },
    });
    expect(member.student_activity_id).toBe(existing.id);
    // Still SUBMITTED — forming a group must not undo work already handed in.
    expect(
      await prisma.student_activity.findUniqueOrThrow({
        where: { id: existing.id },
      }),
    ).toMatchObject({ status: "SUBMITTED" });
  });

  it("refuses a request with no session", async () => {
    const { activity, students } = await classWithStudents(1);

    const response = await request(app)
      .post("/student-activity-group")
      .send({
        activity_id: activity.id,
        members: [{ student_id: students[0].student_id, role: "LEADER" }],
      });

    expect(response.status).toBe(401);
    expect(response.body).toEqual({
      message: "ไม่พบ Token หรือ Token หมดอายุ",
    });
    expect(
      await prisma.student_activity_group.count({
        where: { activity_id: activity.id },
      }),
    ).toBe(0);
  });

  it("refuses a teacher", async () => {
    const { activity, students } = await classWithStudents(1);
    const teacher = await createTeacher();

    const response = await request(app)
      .post("/student-activity-group")
      .set("Cookie", sessionCookie({ userId: teacher.user_id }))
      .send({
        activity_id: activity.id,
        members: [{ student_id: students[0].student_id, role: "LEADER" }],
      });

    expect(response.status).toBe(403);
    expect(response.body).toEqual({
      message: "สิทธิ์การเข้าถึงเฉพาะนักศึกษาเท่านั้น",
    });
    expect(
      await prisma.student_activity_group.count({
        where: { activity_id: activity.id },
      }),
    ).toBe(0);
  });

  it("refuses a request with no member list", async () => {
    const { activity, students } = await classWithStudents(1);

    const response = await request(app)
      .post("/student-activity-group")
      .set("Cookie", sessionCookie({ userId: students[0].student_id }))
      .send({ activity_id: activity.id });

    expect(response.status).toBe(500);
    expect(
      await prisma.student_activity_group.count({
        where: { activity_id: activity.id },
      }),
    ).toBe(0);
  });

  it("refuses a member who is not a student in this system", async () => {
    const { activity, students } = await classWithStudents(1);

    const response = await request(app)
      .post("/student-activity-group")
      .set("Cookie", sessionCookie({ userId: students[0].student_id }))
      .send({
        activity_id: activity.id,
        members: [
          { student_id: students[0].student_id, role: "LEADER" },
          { student_id: "99999999", role: "MEMBER" },
        ],
      });

    expect(response.status).toBe(500);
    // The whole thing is one transaction, so the group the first member was
    // already written into is rolled back with them.
    expect(
      await prisma.student_activity_group.count({
        where: { activity_id: activity.id },
      }),
    ).toBe(0);
  });
});

describe("PATCH /student-activity-group", () => {
  it("adds a member and keeps the answers the existing ones already gave", async () => {
    const { activity, students } = await classWithStudents(3);
    const [leader, answered, added] = students;
    const group = await createActivityGroup({
      activity_id: activity.id,
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
      .patch("/student-activity-group")
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

    const members = await prisma.student_activity_group_member.findMany({
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
    const { activity, students } = await classWithStudents(2);
    const [leader, dropped] = students;
    const group = await createActivityGroup({
      activity_id: activity.id,
      members: [
        { student_id: leader.student_id },
        { student_id: dropped.student_id },
      ],
    });

    const response = await request(app)
      .patch("/student-activity-group")
      .set("Cookie", sessionCookie({ userId: leader.student_id }))
      .send({
        group_id: group.id,
        members: [{ student_id: leader.student_id, role: "LEADER" }],
      });

    expect(response.status).toBe(200);
    expect(
      await prisma.student_activity_group_member.findMany({
        where: { group_id: group.id },
      }),
    ).toHaveLength(1);

    // The submission row stays behind. Leaving a group does not delete the
    // work, and the student is simply back to handing in on their own.
    expect(
      await prisma.student_activity.findFirst({
        where: { activity_id: activity.id, student_id: dropped.student_id },
      }),
    ).not.toBeNull();
  });

  it("refuses a request with no session", async () => {
    const group = await createActivityGroup();

    const response = await request(app)
      .patch("/student-activity-group")
      .send({ group_id: group.id, members: [] });

    expect(response.status).toBe(401);
    expect(
      await prisma.student_activity_group_member.count({
        where: { group_id: group.id },
      }),
    ).toBe(2);
  });

  it("refuses a teacher", async () => {
    const group = await createActivityGroup();
    const teacher = await createTeacher();

    const response = await request(app)
      .patch("/student-activity-group")
      .set("Cookie", sessionCookie({ userId: teacher.user_id }))
      .send({ group_id: group.id, members: [] });

    expect(response.status).toBe(403);
    expect(
      await prisma.student_activity_group_member.count({
        where: { group_id: group.id },
      }),
    ).toBe(2);
  });

  it("refuses a group that does not exist", async () => {
    const student = await createStudent();

    const response = await request(app)
      .patch("/student-activity-group")
      .set("Cookie", sessionCookie({ userId: student.student_id }))
      .send({ group_id: 999_999, members: [] });

    expect(response.status).toBe(500);
  });

  it("empties the group when handed an empty member list", async () => {
    // Recorded, not endorsed. Nothing stops a student sending [] — the members
    // are deleted first and then re-created from the list, so the group is
    // left with nobody in it and no way back through the API. Nor is there a
    // LEADER check, so any member can do it. #27 refuses both.
    const group = await createActivityGroup();
    const leader = group.student_activity_group_member[0];

    const response = await request(app)
      .patch("/student-activity-group")
      .set("Cookie", sessionCookie({ userId: leader.student_id }))
      .send({ group_id: group.id, members: [] });

    expect(response.status).toBe(200);
    expect(
      await prisma.student_activity_group_member.count({
        where: { group_id: group.id },
      }),
    ).toBe(0);
  });
});

describe("GET /student-activity-group", () => {
  it("returns the group the student is in for that activity", async () => {
    const { activity, students } = await classWithStudents(2);
    const [leader, member] = students;
    const group = await createActivityGroup({
      activity_id: activity.id,
      members: [
        { student_id: leader.student_id },
        { student_id: member.student_id },
      ],
    });

    const response = await request(app)
      .get("/student-activity-group")
      .query({ student_id: member.student_id, activity_id: activity.id });

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

  it("returns null when the student has no group for that activity", async () => {
    const { activity, students } = await classWithStudents(1);

    const response = await request(app)
      .get("/student-activity-group")
      .query({
        student_id: students[0].student_id,
        activity_id: activity.id,
      });

    expect(response.status).toBe(200);
    expect(response.body.data).toBeNull();
  });

  it("answers 500 when the activity_id is missing", async () => {
    // parseInt(undefined) is NaN, which Prisma sends as null, and activity_id
    // is NOT NULL — so the query is rejected rather than matching nothing.
    // #20 turns this into a 400, here and everywhere else it happens.
    const student = await createStudent();

    const response = await request(app)
      .get("/student-activity-group")
      .query({ student_id: student.student_id });

    expect(response.status).toBe(500);
  });
});

describe("GET /student-activity-group/all", () => {
  it("returns every group the student is in across the section", async () => {
    const { course, students } = await classWithStudents(3);
    const [student, ...partners] = students;
    const groups = [];
    // Different partners in each: two groups with the same member list are
    // collapsed into one, which the next case is about.
    for (const partner of partners) {
      const activity = await createActivity({
        section_id: course.section_id,
        activity_type: "group",
      });
      groups.push(
        await createActivityGroup({
          activity_id: activity.id,
          members: [
            { student_id: student.student_id },
            { student_id: partner.student_id },
          ],
        }),
      );
    }

    const response = await request(app)
      .get("/student-activity-group/all")
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
    // Recorded, not endorsed. Two activities set for the same pair of students
    // are two real groups, and the caller is shown one of them — the endpoint
    // de-duplicates on the member list and drops the rest, and the response
    // carries no activity_id to tell them apart by.
    const { course, students } = await classWithStudents(2);
    const [leader, member] = students;
    const activities = [
      await createActivity({
        section_id: course.section_id,
        activity_type: "group",
      }),
      await createActivity({
        section_id: course.section_id,
        activity_type: "group",
      }),
    ];
    for (const activity of activities) {
      await createActivityGroup({
        activity_id: activity.id,
        members: [
          { student_id: leader.student_id },
          { student_id: member.student_id },
        ],
      });
    }

    const response = await request(app)
      .get("/student-activity-group/all")
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
      .get("/student-activity-group/all")
      .query({ student_id: student.student_id, section_id: course.section_id });

    expect(response.status).toBe(200);
    expect(response.body.data).toEqual([]);
  });

  it("shows every group in the section when the student_id is missing", async () => {
    // Recorded, not endorsed. `some: { student_id: undefined }` is not a filter
    // that matches nothing, it is no filter at all — so dropping the parameter
    // widens the answer from "my groups" to "everyone's", and the caller is
    // shown the member lists of students they were never part of a group with.
    // #26 makes this a 400.
    const { course, activity, students } = await classWithStudents(2);
    await createActivityGroup({
      activity_id: activity.id,
      members: [
        { student_id: students[0].student_id },
        { student_id: students[1].student_id },
      ],
    });

    const response = await request(app)
      .get("/student-activity-group/all")
      .query({ section_id: course.section_id });

    expect(response.status).toBe(200);
    expect(response.body.data).toHaveLength(1);
  });
});

describe("GET /student-activity-group/without-group", () => {
  it("returns the enrolled students who are in no group for the activity", async () => {
    const { course, activity, students } = await classWithStudents(3);
    const [leader, member, alone] = students;
    await createActivityGroup({
      activity_id: activity.id,
      members: [
        { student_id: leader.student_id },
        { student_id: member.student_id },
      ],
    });

    const response = await request(app)
      .get("/student-activity-group/without-group")
      .query({ section_id: course.section_id, activity_id: activity.id });

    expect(response.status).toBe(200);
    expect(response.body.data).toEqual([
      { student_id: alone.student_id, full_name_th: alone.full_name_th },
    ]);
  });

  it("counts an invited student who has not answered as being in a group", async () => {
    const { course, activity, students } = await classWithStudents(2);
    await createActivityGroup({
      activity_id: activity.id,
      members: [
        { student_id: students[0].student_id },
        { student_id: students[1].student_id, status: "PENDING" },
      ],
    });

    const response = await request(app)
      .get("/student-activity-group/without-group")
      .query({ section_id: course.section_id, activity_id: activity.id });

    expect(response.status).toBe(200);
    expect(response.body.data).toEqual([]);
  });

  it("returns an empty list when no one is enrolled in the section", async () => {
    const course = await createCourse();
    const activity = await createActivity({ section_id: course.section_id });

    const response = await request(app)
      .get("/student-activity-group/without-group")
      .query({ section_id: course.section_id, activity_id: activity.id });

    expect(response.status).toBe(200);
    expect(response.body.data).toEqual([]);
  });

  it("answers 500 when the section_id is missing", async () => {
    // student_course.section_id is NOT NULL, so the NaN parseInt produces is
    // rejected rather than matching nothing. #20 turns this into a 400.
    const { activity } = await classWithStudents(1);

    const response = await request(app)
      .get("/student-activity-group/without-group")
      .query({ activity_id: activity.id });

    expect(response.status).toBe(500);
  });
});
