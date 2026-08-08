import prisma from "../../src/config/prisma";
import { BASELINE } from "../seed";
import { nextStudentId, nextUserId } from "./ids";

/**
 * People. Everything here is invented — the names are the Thai equivalent of
 * "John Doe", the emails are on the reserved .test TLD, and no value comes
 * from a real person.
 *
 * A case should pass only the fields it is about. If a test says
 * `createTeacher({ email: "duplicate@example.test" })` the reader knows the
 * email is the point; if it says `createTeacher()` the reader knows the person
 * is scenery.
 */

export interface UserOptions {
  user_id?: string;
  email?: string;
  title_th?: string;
  first_name_th?: string;
  last_name_th?: string;
  title_en?: string;
  first_name_en?: string;
  last_name_en?: string;
  phone?: string;
  department_id?: string;
  program_id?: string;
  /**
   * role_id values from the baseline roles table. Left empty by default: a
   * user with no role is authenticated but not authorised, and several cases
   * are about exactly that difference.
   */
  roles?: string[];
}

export async function createUser(options: UserOptions = {}) {
  const user_id = options.user_id ?? nextUserId();

  return prisma.users.create({
    data: {
      user_id,
      email: options.email ?? `${user_id}@example.test`,
      phone: options.phone ?? "020000000",
      title_th: options.title_th ?? "อ.",
      first_name_th: options.first_name_th ?? "สมชาย",
      last_name_th: options.last_name_th ?? "ใจดี",
      title_en: options.title_en ?? "Mr.",
      first_name_en: options.first_name_en ?? "Somchai",
      last_name_en: options.last_name_en ?? "Jaidee",
      department_id: options.department_id ?? BASELINE.department.department_id,
      program_id: options.program_id ?? BASELINE.program.program_id,
      user_roles_user_roles_user_idTousers: {
        create: (options.roles ?? []).map((role_id) => ({
          role_id,
          is_active: true,
        })),
      },
    },
  });
}

/**
 * A user who will get past requireRole("TEACHER"). The role is granted in the
 * database, not asserted in the token — the middleware re-reads it either way
 * — so this is the only way to make a teacher.
 */
export function createTeacher(options: UserOptions = {}) {
  return createUser({ roles: ["TEACHER"], ...options });
}

export interface StudentOptions extends Omit<UserOptions, "user_id"> {
  student_id?: string;
  status?: "active" | "inactive" | "graduated" | "suspended";
}

/**
 * Both rows: student.student_id is the primary key of `student` *and* a
 * foreign key to users.user_id, so a student without a user is not
 * representable. Returns the student row with its user included, because a
 * case usually needs the id for a cookie and the name for an assertion.
 *
 * full_name_th and admission_year are generated columns — do not pass them,
 * read them back.
 */
export async function createStudent(options: StudentOptions = {}) {
  const student_id = options.student_id ?? nextStudentId();
  const department_id =
    options.department_id ?? BASELINE.department.department_id;
  const program_id = options.program_id ?? BASELINE.program.program_id;
  const first_name_th = options.first_name_th ?? "สมหญิง";
  const last_name_th = options.last_name_th ?? "เรียนดี";

  await createUser({
    ...options,
    user_id: student_id,
    department_id,
    program_id,
    roles: options.roles ?? ["STUDENT"],
    title_th: options.title_th ?? "น.ส.",
    first_name_th,
    last_name_th,
    title_en: options.title_en ?? "Ms.",
    first_name_en: options.first_name_en ?? "Somying",
    last_name_en: options.last_name_en ?? "Riandee",
  });

  return prisma.student.create({
    data: {
      student_id,
      first_name_th,
      last_name_th,
      department_id,
      program_id,
      status: options.status ?? "active",
    },
    include: { users: true },
  });
}
