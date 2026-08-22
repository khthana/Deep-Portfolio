import prisma from "../config/prisma";
import type { StudentDetail } from "@deep-portfolio/api-types";

export default class UserService {
  async getUserDetail(userId: string) {
    const result = await prisma.users.findUnique({
      where: { user_id: userId },
    });

    return result;
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
