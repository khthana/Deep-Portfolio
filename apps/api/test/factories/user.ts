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
  /**
   * The six name parts and the phone take null as well as a string, because
   * their columns do and a case about an empty one cannot be written
   * otherwise. `?? "อ."` would turn the null straight back into a default and
   * take the case with it — the same trap ADR-0038 named, in the factory that
   * predates it.
   */
  title_th?: string | null;
  first_name_th?: string | null;
  last_name_th?: string | null;
  title_en?: string | null;
  first_name_en?: string | null;
  last_name_en?: string | null;
  phone?: string | null;
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
      phone: options.phone === undefined ? "020000000" : options.phone,
      title_th: options.title_th === undefined ? "อ." : options.title_th,
      first_name_th:
        options.first_name_th === undefined ? "สมชาย" : options.first_name_th,
      last_name_th:
        options.last_name_th === undefined ? "ใจดี" : options.last_name_th,
      title_en: options.title_en === undefined ? "Mr." : options.title_en,
      first_name_en:
        options.first_name_en === undefined ? "Somchai" : options.first_name_en,
      last_name_en:
        options.last_name_en === undefined ? "Jaidee" : options.last_name_en,
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

export interface StudentOptions extends Omit<
  UserOptions,
  "user_id" | "first_name_th" | "last_name_th"
> {
  student_id?: string;
  status?: "active" | "inactive" | "graduated" | "suspended";
  /**
   * Not widened to null the way the rest of the name parts are: these two go
   * into `student` as well as `users`, and `student` refuses null for both. A
   * case wanting a student with no first name is a case about a row the
   * database will not hold.
   */
  first_name_th?: string;
  last_name_th?: string;
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

  // `=== undefined` rather than `??` for the four that take null, so a case
  // asking for an empty title gets one instead of the default (ADR-0038).
  await createUser({
    ...options,
    user_id: student_id,
    department_id,
    program_id,
    roles: options.roles ?? ["STUDENT"],
    title_th: options.title_th === undefined ? "น.ส." : options.title_th,
    first_name_th,
    last_name_th,
    title_en: options.title_en === undefined ? "Ms." : options.title_en,
    first_name_en:
      options.first_name_en === undefined ? "Somying" : options.first_name_en,
    last_name_en:
      options.last_name_en === undefined ? "Riandee" : options.last_name_en,
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
