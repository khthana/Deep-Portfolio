import type { Client } from "pg";

/**
 * Reference data — the rows that are already there when a test case starts.
 *
 * Seeded into the template database once per run, so every test file inherits
 * it by copy rather than by re-inserting it. Two consequences worth knowing:
 * a test never has to build a faculty just to reach a course, and a test may
 * not assume a table it did not write to is empty.
 *
 * What belongs here is only the data the institution would have configured
 * before anyone used the system: the organisational chart, the role
 * vocabulary, and the term the system considers current. Anything a case is
 * actually about — a user, a course, an activity — belongs in the case, via
 * the factories in ./factories.
 *
 * Every value is invented. None of it comes from a real faculty, department,
 * programme, or person, and nothing here is personal data.
 */

export const BASELINE = {
  faculty: {
    faculty_id: "90",
    faculty_name_th: "คณะตัวอย่าง",
    faculty_name_en: "Example Faculty",
  },

  department: {
    department_id: "91",
    department_name_th: "ภาควิชาคอมพิวเตอร์ตัวอย่าง",
    department_name_en: "Example Department of Computing",
    faculty_id: "90",
  },

  /** A second department, so a case about scoping has something to be scoped
   *  away from without having to build the chain itself. */
  otherDepartment: {
    department_id: "92",
    department_name_th: "ภาควิชาออกแบบตัวอย่าง",
    department_name_en: "Example Department of Design",
    faculty_id: "90",
  },

  program: {
    program_id: "9101",
    program_name_th: "หลักสูตรคอมพิวเตอร์ตัวอย่าง",
    program_name_en: "Example Computing Programme",
    department_id: "91",
    year: "2565",
  },

  /** Belongs to otherDepartment, and is what a case uses when it needs a
   *  programme that is not the default one. */
  otherProgram: {
    program_id: "9201",
    program_name_th: "หลักสูตรออกแบบตัวอย่าง",
    program_name_en: "Example Design Programme",
    department_id: "92",
    year: "2565",
  },

  /**
   * One row per value of role_enum. The role_id is the natural primary key and
   * the application compares against it as a literal — verifyTeacher looks for
   * role_id "TEACHER" — so the ids here are not free to change.
   */
  roles: [
    { role_id: "FULL_ADMIN", role_name: "Full admin", priority: 1 },
    { role_id: "FACULTY_ADMIN", role_name: "Faculty admin", priority: 2 },
    { role_id: "DEPT_ADMIN", role_name: "Department admin", priority: 3 },
    { role_id: "PROG_MANAGER", role_name: "Programme manager", priority: 4 },
    { role_id: "TEACHER", role_name: "Teacher", priority: 5 },
    { role_id: "STUDENT", role_name: "Student", priority: 6 },
    { role_id: "GUEST", role_name: "Guest", priority: 7 },
  ],

  /**
   * The academic term a case means by "now". There is no table for terms —
   * academic_year and semester are columns on semester_courses — so these are
   * constants rather than seeded rows, and the course factory defaults to
   * `term`. `previousTerm` is what a case uses to make a course archived,
   * which is the only thing that distinguishes the two lists returned by
   * GET /course/list.
   */
  term: { academic_year: "2568", semester: 1 },
  previousTerm: { academic_year: "2567", semester: 2 },
} as const;

/**
 * Runs against the template database, before any test file copies it. Uses a
 * plain pg client rather than Prisma for the same reason the migration does:
 * Postgres refuses CREATE DATABASE ... TEMPLATE while anything is still
 * connected to the source, and a client this file opened is a client this file
 * can be sure it closed.
 */
export async function seedBaseline(client: Client): Promise<void> {
  const { faculty } = BASELINE;

  await client.query(
    `INSERT INTO faculty (faculty_id, faculty_name_th, faculty_name_en)
     VALUES ($1, $2, $3)`,
    [faculty.faculty_id, faculty.faculty_name_th, faculty.faculty_name_en],
  );

  for (const department of [BASELINE.department, BASELINE.otherDepartment]) {
    await client.query(
      `INSERT INTO departments
         (department_id, department_name_th, department_name_en, faculty_id)
       VALUES ($1, $2, $3, $4)`,
      [
        department.department_id,
        department.department_name_th,
        department.department_name_en,
        department.faculty_id,
      ],
    );
  }

  for (const program of [BASELINE.program, BASELINE.otherProgram]) {
    await client.query(
      `INSERT INTO programs
         (program_id, program_name_th, program_name_en, department_id, year)
       VALUES ($1, $2, $3, $4, $5)`,
      [
        program.program_id,
        program.program_name_th,
        program.program_name_en,
        program.department_id,
        program.year,
      ],
    );
  }

  for (const role of BASELINE.roles) {
    await client.query(
      `INSERT INTO roles (role_id, role_name, priority) VALUES ($1, $2, $3)`,
      [role.role_id, role.role_name, role.priority],
    );
  }
}
