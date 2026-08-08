import { describe, expect, it } from "vitest";
import request from "supertest";
import app from "../src/app";
import prisma from "../src/config/prisma";
import { BASELINE } from "./seed";
import {
  createActivity,
  createActivityGroup,
  createActivityRubric,
  createCourse,
  createFileAttachment,
  createLearningActivity,
  createLearningActivityGroup,
  createLearningSubmission,
  createPortfolio,
  createPortfolioCertificate,
  createPortfolioEducation,
  createPortfolioPersonal,
  createPortfolioSkill,
  createPortfolioTemplate,
  createPortfolioTraining,
  createSharedRubric,
  createSharedRubricDetail,
  createStudent,
  createSubmission,
  createTeacher,
  createUser,
  enrolStudent,
  mapActivityToCLO,
  mapLearningActivityToCLO,
} from "./factories";
import { sessionCookie } from "./helpers/session";

/**
 * Tests for the test harness. Everything here is a claim other test files are
 * entitled to rely on: that the reference data is there, that a factory called
 * with nothing produces a row the schema accepts, and that the foreign keys
 * underneath it were filled in rather than left dangling.
 *
 * Without this, a factory that quietly stopped satisfying a constraint would
 * surface as an unrelated feature test failing for an unrelated-looking reason.
 */

describe("the baseline seed", () => {
  it("arrives with the reference data and nothing else", async () => {
    // Must stay the first case in this file: the "nothing else" half is only
    // true before any other case has created anyone.
    expect(await prisma.faculty.count()).toBe(1);
    expect(await prisma.departments.count()).toBe(2);
    expect(await prisma.programs.count()).toBe(2);
    expect(await prisma.roles.count()).toBe(BASELINE.roles.length);

    expect(await prisma.users.count()).toBe(0);
    expect(await prisma.subjects.count()).toBe(0);
    expect(await prisma.course_sections.count()).toBe(0);
  });

  it("hangs the programmes off their departments and faculty", async () => {
    const program = await prisma.programs.findUniqueOrThrow({
      where: { program_id: BASELINE.program.program_id },
      include: { departments: { include: { faculty: true } } },
    });

    expect(program.departments?.department_id).toBe(
      BASELINE.department.department_id,
    );
    expect(program.departments?.faculty?.faculty_id).toBe(
      BASELINE.faculty.faculty_id,
    );
  });
});

describe("createUser", () => {
  it("grants no role unless the case asks for one", async () => {
    const user = await createUser();

    expect(
      await prisma.user_roles.count({ where: { user_id: user.user_id } }),
    ).toBe(0);
  });

  it("grants the roles the case asks for", async () => {
    const teacher = await createTeacher();

    const roles = await prisma.user_roles.findMany({
      where: { user_id: teacher.user_id },
    });

    expect(roles.map((role) => role.role_id)).toEqual(["TEACHER"]);
    expect(roles[0]?.is_active).toBe(true);
  });
});

describe("createStudent", () => {
  it("creates the user row the student row needs", async () => {
    const student = await createStudent();

    // student_id is both the primary key of `student` and a foreign key to
    // users.user_id, so a student the factory built has to be both.
    expect(student.users.user_id).toBe(student.student_id);
    expect(student.users.email).toBe(`${student.student_id}@example.test`);
  });

  it("lets the database fill in the generated columns", async () => {
    const student = await createStudent({
      first_name_th: "ธนา",
      last_name_th: "ตั้งใจเรียน",
    });

    expect(student.full_name_th).toBe("ธนา ตั้งใจเรียน");
    // left(student_id, 2)::int + 2500, and the ids start with "65".
    expect(student.admission_year).toBe("2565");
  });

  it("attaches the student to the seeded department and programme", async () => {
    const student = await createStudent();

    const response = await request(app)
      .get("/user/student")
      .set("Cookie", sessionCookie({ userId: student.student_id }));

    expect(response.status).toBe(200);
    expect(response.body.data).toMatchObject({
      student_id: student.student_id,
      department_name: BASELINE.department.department_name_th,
      program_name: BASELINE.program.program_name_th,
    });
  });
});

describe("createCourse", () => {
  it("builds the whole subject-term-section chain", async () => {
    const teacher = await createTeacher();
    const course = await createCourse({ teacher_id: teacher.user_id });

    const section = await prisma.course_sections.findUniqueOrThrow({
      where: { section_id: course.section_id },
      include: {
        semester_courses: { include: { subjects: true, programs: true } },
        course_sections_teacher: true,
      },
    });

    expect(section.semester_courses.subjects.subject_id).toBe(course.subject_id);
    expect(section.semester_courses.academic_year).toBe(
      BASELINE.term.academic_year,
    );
    expect(section.semester_courses.programs?.program_id).toBe(
      BASELINE.program.program_id,
    );
    expect(section.course_sections_teacher.map((t) => t.user_id)).toEqual([
      teacher.user_id,
    ]);
  });

  it("puts two sections of the same subject under one term row", async () => {
    const first = await createCourse();
    const second = await createCourse({
      subject_id: first.subject_id,
      section_number: "2",
    });

    expect(second.semester_course_id).toBe(first.semester_course_id);
    expect(second.section_id).not.toBe(first.section_id);
  });

  it("enrols a student in a section", async () => {
    const student = await createStudent();
    const course = await createCourse();

    await enrolStudent(course.section_id, student.student_id);

    expect(
      await prisma.student_course.findMany({
        where: { section_id: course.section_id },
      }),
    ).toHaveLength(1);
  });
});

describe("createActivity and createSubmission", () => {
  it("gives an activity a section to belong to", async () => {
    const activity = await createActivity();

    expect(activity.section_id).not.toBeNull();
    expect(
      await prisma.course_sections.findUnique({
        where: { section_id: activity.section_id ?? 0 },
      }),
    ).not.toBeNull();
  });

  it("builds a submission out of nothing at all", async () => {
    // The deepest chain in the schema this suite touches: a submission needs a
    // student, which needs a user, a department and a programme; and an
    // activity, which needs a section, a term row and a subject.
    const submission = await createSubmission({ score: 8 });

    expect(Number(submission.score)).toBe(8);
    expect(
      await prisma.student.findUnique({
        where: { student_id: submission.student_id },
      }),
    ).not.toBeNull();
    expect(
      await prisma.activities.findUnique({
        where: { id: submission.activity_id },
      }),
    ).not.toBeNull();
  });

  it("uses the activity the case names", async () => {
    const course = await createCourse();
    const activity = await createActivity({
      section_id: course.section_id,
      activity_name: "รายงานกลุ่ม",
      activity_type: "group",
      score_number: 20,
    });
    const submission = await createSubmission({ activity_id: activity.id });

    expect(submission.activity_id).toBe(activity.id);
    expect(activity.section_id).toBe(course.section_id);
  });
});

describe("createLearningActivity and createLearningSubmission", () => {
  it("builds a learning submission out of nothing at all", async () => {
    const submission = await createLearningSubmission();

    expect(
      await prisma.student.findUnique({
        where: { student_id: submission.student_id },
      }),
    ).not.toBeNull();
    expect(
      await prisma.learning_activities.findUnique({
        where: { id: submission.learning_activity_id },
      }),
    ).not.toBeNull();
  });

  it("puts the learning activity in the section the case names", async () => {
    const course = await createCourse();
    const activity = await createLearningActivity({
      section_id: course.section_id,
      learning_activity_type: "group",
    });

    expect(activity.section_id).toBe(course.section_id);
    expect(activity.learning_activity_type).toBe("group");
  });
});

describe("createActivityGroup and createLearningActivityGroup", () => {
  it("builds a group of two out of nothing at all", async () => {
    const group = await createActivityGroup();

    // A leader who is already in, and one member still waiting to answer —
    // how a group looks the moment the endpoint creates it.
    expect(
      group.student_activity_group_member.map((member) => [
        member.role,
        member.status,
      ]),
    ).toEqual([
      ["LEADER", "ACCEPT"],
      ["MEMBER", "PENDING"],
    ]);
    expect(
      await prisma.activities.findUnique({ where: { id: group.activity_id } }),
    ).not.toBeNull();
  });

  it("gives every member their own submission row", async () => {
    // student_activity_group_member.student_activity_id is unique and a real
    // foreign key, so a group cannot exist without one submission per member.
    const group = await createActivityGroup();

    const submissionIds = group.student_activity_group_member.map(
      (member) => member.student_activity_id,
    );
    expect(new Set(submissionIds).size).toBe(2);
    expect(
      await prisma.student_activity.findMany({
        where: { id: { in: submissionIds } },
        select: { activity_id: true, status: true },
      }),
    ).toEqual([
      { activity_id: group.activity_id, status: "NOT_SUBMITTED" },
      { activity_id: group.activity_id, status: "NOT_SUBMITTED" },
    ]);
  });

  it("gives a token only to the people who have something to answer", async () => {
    const group = await createActivityGroup();
    const [leader, member] = group.student_activity_group_member;

    expect(leader.invite_token).toBeNull();
    expect(leader.token_expiry).toBeNull();
    expect(member.invite_token).toEqual(expect.any(String));
    // A week out, as the endpoint mints them — so a case about an expired
    // invite has to say so.
    expect(member.token_expiry?.getTime()).toBeGreaterThan(Date.now());
  });

  it("uses the token and expiry a case names", async () => {
    const group = await createActivityGroup({
      members: [
        {},
        { invite_token: "known-token", token_expiry: new Date("2020-01-01") },
      ],
    });

    expect(group.student_activity_group_member[1]).toMatchObject({
      invite_token: "known-token",
    });
    expect(
      group.student_activity_group_member[1].token_expiry?.getFullYear(),
    ).toBe(2020);
  });

  it("gives two groups arranged in one case different tokens", async () => {
    const [first, second] = [
      await createActivityGroup(),
      await createActivityGroup(),
    ];

    expect(first.student_activity_group_member[1].invite_token).not.toBe(
      second.student_activity_group_member[1].invite_token,
    );
  });

  it("builds the learning-activity side the same way", async () => {
    const group = await createLearningActivityGroup();

    expect(
      group.student_learning_activity_group_member.map((member) => [
        member.role,
        member.status,
      ]),
    ).toEqual([
      ["LEADER", "ACCEPT"],
      ["MEMBER", "PENDING"],
    ]);
    expect(
      await prisma.student_learning_activity.findMany({
        where: {
          id: {
            in: group.student_learning_activity_group_member.map(
              (member) => member.student_learning_activity_id,
            ),
          },
        },
      }),
    ).toHaveLength(2);
  });
});

describe("createSharedRubric and createSharedRubricDetail", () => {
  it("puts a rubric in the baseline programme and gives it a unique code", async () => {
    const first = await createSharedRubric();
    const second = await createSharedRubric();

    expect(first.program_id).toBe(BASELINE.program.program_id);
    // rubric_code is unique across the whole table, so two rubrics arranged in
    // one case must not collide.
    expect(first.rubric_code).not.toBe(second.rubric_code);
  });

  it("hangs a criterion off the rubric it was given", async () => {
    const rubric = await createSharedRubric();
    const detail = await createSharedRubricDetail({ rubric_id: rubric.id });

    expect(detail.rubric_id).toBe(rubric.id);
    // Four levels, four columns — all of them filled in.
    expect(detail.level_4_description).not.toBeNull();
    expect(detail.level_1_description).not.toBeNull();
  });
});

describe("createActivityRubric", () => {
  it("builds a criterion with its levels out of nothing at all", async () => {
    const rubric = await createActivityRubric();

    expect(
      await prisma.activities.findUnique({ where: { id: rubric.activity_id } }),
    ).not.toBeNull();

    const levels = await prisma.rubric_levels.findMany({
      where: { rubric_id: rubric.id },
      orderBy: { level_no: "asc" },
    });
    expect(levels.map((level) => level.level_no)).toEqual([1, 2, 3, 4]);
  });

  it("gives the criterion only the levels the case asks for", async () => {
    const rubric = await createActivityRubric({
      criteria: "ความคิดสร้างสรรค์",
      levels: [
        { level_no: 1, description: "ยังไม่ถึงเกณฑ์" },
        { level_no: 2, description: "ถึงเกณฑ์" },
      ],
    });

    expect(rubric.criteria).toBe("ความคิดสร้างสรรค์");
    expect(
      await prisma.rubric_levels.count({ where: { rubric_id: rubric.id } }),
    ).toBe(2);
  });
});

describe("mapActivityToCLO and mapLearningActivityToCLO", () => {
  it("arranges the score category the mapping's foreign key needs", async () => {
    // activity_clo_mapping.score_ratio_id is NOT NULL with a real foreign key
    // behind it, so the factory has to make one even though no case is about it.
    const mapping = await mapActivityToCLO();

    expect(
      await prisma.subject_score_ratio.findUnique({
        where: { score_ratio_id: mapping.score_ratio_id },
      }),
    ).not.toBeNull();
    expect(
      await prisma.subject_clo.findUnique({
        where: { clo_id: mapping.clo_id ?? 0 },
      }),
    ).not.toBeNull();
  });

  it("numbers a second mapping on the same activity after the first", async () => {
    const activity = await createActivity();
    const first = await mapActivityToCLO({ activity_id: activity.id });
    const second = await mapActivityToCLO({ activity_id: activity.id });

    // The endpoint assigns sequence_order the same way, and the pair is unique.
    expect(first.sequence_order).toBe(1);
    expect(second.sequence_order).toBe(2);
  });

  it("builds a learning-activity mapping out of nothing at all", async () => {
    const mapping = await mapLearningActivityToCLO();

    expect(
      await prisma.learning_activities.findUnique({
        where: { id: mapping.learning_activity_id },
      }),
    ).not.toBeNull();
    expect(
      await prisma.subject_clo.findUnique({
        where: { clo_id: mapping.clo_id ?? 0 },
      }),
    ).not.toBeNull();
  });
});

describe("the portfolio factories", () => {
  it("invents a student for a portfolio row that is not given one", async () => {
    // Every portfolio table hangs off users.user_id, and the public share
    // endpoint reads the student row behind it as well — so "invents a user"
    // has to mean a student, not just an account.
    const education = await createPortfolioEducation();

    expect(
      await prisma.student.findUnique({
        where: { student_id: education.user_id },
      }),
    ).not.toBeNull();
  });

  it("puts every section of one student's portfolio under the same user", async () => {
    const student = await createStudent();
    const rows = await Promise.all([
      createPortfolio({ user_id: student.student_id }),
      createPortfolioPersonal({ user_id: student.student_id }),
      createPortfolioEducation({ user_id: student.student_id }),
      createPortfolioTraining({ user_id: student.student_id }),
      createPortfolioCertificate({ user_id: student.student_id }),
      createPortfolioSkill({ user_id: student.student_id }),
    ]);

    expect(rows.map((row) => row.user_id)).toEqual(
      rows.map(() => student.student_id),
    );
  });

  it("gives a portfolio a share token even when no case asks for one", async () => {
    // The column defaults to gen_random_uuid(), so a portfolio is shareable
    // from the moment it exists.
    const portfolio = await createPortfolio();

    expect(portfolio.public_share_token).not.toBeNull();
    expect(portfolio.share_expires_at).toBeNull();
  });

  it("writes the join rows that put an attachment on an entry", async () => {
    const file = await createFileAttachment();
    const training = await createPortfolioTraining({
      attachment_ids: [file.attachment_id],
    });
    const certificate = await createPortfolioCertificate({
      attachment_ids: [file.attachment_id],
    });

    expect(
      await prisma.portfolio_training_attachments.findMany({
        where: { training_id: training.id },
      }),
    ).toEqual([
      { training_id: training.id, attachment_id: file.attachment_id },
    ]);
    expect(
      await prisma.portfolio_certificate_attachments.findMany({
        where: { certificate_id: certificate.id },
      }),
    ).toEqual([
      { certificate_id: certificate.id, attachment_id: file.attachment_id },
    ]);
  });

  it("points a portfolio at the skills the case named", async () => {
    const student = await createStudent();
    const skill = await createPortfolioSkill({ user_id: student.student_id });
    const portfolio = await createPortfolio({
      user_id: student.student_id,
      skill_ids: [skill.id],
    });

    expect(
      await prisma.portfolio_skill_mapping.findMany({
        where: { portfolio_id: portfolio.id },
      }),
    ).toEqual([{ portfolio_id: portfolio.id, skill_id: skill.id }]);
  });

  it("hangs a portfolio off the template the case named", async () => {
    const template = await createPortfolioTemplate({ name: "แม่แบบตัวอย่าง" });
    const portfolio = await createPortfolio({ template_id: template.id });

    expect(
      await prisma.portfolio.findUniqueOrThrow({
        where: { id: portfolio.id },
        include: { portfolio_template: true },
      }),
    ).toMatchObject({ portfolio_template: { name: "แม่แบบตัวอย่าง" } });
  });
});
