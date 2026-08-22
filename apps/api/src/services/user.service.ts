import prisma from "../config/prisma";
import type { StudentDetail, UserDetail } from "@deep-portfolio/api-types";

export default class UserService {
  /**
   * One `users` row, named column by column.
   *
   * The `select` is the point. This used to be a bare `findUnique`, which
   * hands back every scalar the table has — so `GET /user` answered a caller
   * `password`, `verification_token`, `is_verified` and `status` along with
   * the profile they asked for. Nothing here writes the first two, sign-in
   * being Google's, so what went out was two nulls; what was wrong is that the
   * response carried the keys at all. No screen has ever read any of the four
   * (#68, and BEHAVIOR-CHANGES.md).
   *
   * `course.service.ts` calls this too, for a section's teacher, and reads
   * nine of the thirteen. It never passes the row on whole.
   */
  async getUserDetail(userId: string): Promise<UserDetail | null> {
    const user = await prisma.users.findUnique({
      where: { user_id: userId },
      select: {
        user_id: true,
        email: true,
        phone: true,
        title_th: true,
        first_name_th: true,
        last_name_th: true,
        title_en: true,
        first_name_en: true,
        last_name_en: true,
        department_id: true,
        program_id: true,
        created_at: true,
        updated_at: true,
      },
    });

    if (!user) {
      return null;
    }

    return {
      ...user,
      // ISO strings, as JSON.stringify would have made them anyway. Both are
      // seven hours ahead of the moment they record, because the column is a
      // `timestamp` without a zone and its default writes Bangkok local time
      // into it — pinned in BEHAVIOR-CHANGES.md, not this ticket's to fix.
      created_at: user.created_at?.toISOString() ?? null,
      updated_at: user.updated_at?.toISOString() ?? null,
    };
  }

  async getStudentDetail(student_id: string): Promise<StudentDetail | null> {
    const student = await prisma.student.findUnique({
      where: { student_id },
      select: {
        student_id: true,
        full_name_th: true,
        first_name_th: true,
        last_name_th: true,
        users: {
          select: {
            user_id: true,
            title_th: true,
            email: true,
            phone: true,
          },
        },
        departments: {
          select: {
            department_name_th: true,
          },
        },
        programs: {
          select: {
            program_name_th: true,
          },
        },
      },
    });

    if (!student) {
      return null;
    }

    const result: StudentDetail = {
      user_id: student.users.user_id ?? "",
      student_id: student.student_id ?? "",
      full_name_th: student.full_name_th ?? "",
      first_name_th: student.first_name_th ?? "",
      last_name_th: student.last_name_th ?? "",
      title_th: student.users.title_th ?? "",
      email: student.users.email ?? "",
      phone: student.users.phone ?? "",
      department_name: student.departments.department_name_th ?? "",
      program_name: student.programs.program_name_th ?? "",
    };

    return result;
  }
}
