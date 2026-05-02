import {
  GradebookPerStudentResp,
  GradebookPerActivityResp,
  ActivityData,
  StudentSubmittionData,
} from "../models/gradebook.model";
import prisma from "../config/prisma";

export class GradebookService {
  async getGradebookPerStudent(
    section_id: number,
  ): Promise<GradebookPerStudentResp> {
    const studentCourses = await prisma.student_course.findMany({
      where: { section_id },
      select: { student_id: true },
    });
    const studentIds = studentCourses.map((sc) => sc.student_id);

    if (studentIds.length === 0) {
      return {
        section_id: section_id,
        students: [],
      };
    }

    const [students, studentActivities] = await Promise.all([
      prisma.student.findMany({
        where: {
          student_id: { in: studentIds },
        },
        select: {
          student_id: true,
          full_name_th: true,
        },
        orderBy: { student_id: "asc" },
      }),
      prisma.student_activity.findMany({
        where: { activities: { section_id } },
        select: {
          id: true,
          status: true,
          score: true,
          submitted_at: true,
          student_id: true,
          activities: {
            select: {
              id: true,
              activity_name: true,
              deadline_date: true,
              score_number: true,
            },
          },
        },
      }),
    ]);

    const studentMap = new Map<string, StudentSubmittionData>();

    students.forEach((s) => {
      studentMap.set(s.student_id, {
        student_id: s.student_id,
        student_name: s.full_name_th ?? "",
        on_time_submissions: 0,
        late_submissions: 0,
        missing_submissions: 0,
        total_score: 0,
        activities: [],
      });
    });

    for (const sa of studentActivities) {
      const studentData = studentMap.get(sa.student_id);
      if (!studentData) continue;

      const status = sa.status;
      if (
        status === "SUBMITTED" &&
        sa.activities.deadline_date &&
        sa.submitted_at! > sa.activities.deadline_date
      ) {
        studentData.late_submissions++;
      } else if (
        status === "SUBMITTED" ||
        status === "GRADED" ||
        status === "GRADING"
      ) {
        studentData.on_time_submissions++;
      } else if (status === "NOT_SUBMITTED") {
        studentData.missing_submissions++;
      }

      const score = sa.score ? Number(sa.score) : null;
      if (score) {
        studentData.total_score += score;
      }

      studentData.activities.push({
        activity_id: sa.activities.id,
        activity_name: sa.activities.activity_name,
        full_score: Number(sa.activities.score_number),
        score: score,
        status: sa.status,
      });
    }

    const studentsResult = Array.from(studentMap.values());

    for (const student of studentsResult) {
      student.total_score = Math.round(student.total_score * 100) / 100;
    }

    return {
      section_id: section_id,
      students: studentsResult,
    };
  }

  async getGradebookPerActivity(
    section_id: number,
  ): Promise<GradebookPerActivityResp> {
    const activities = await prisma.activities.findMany({
      where: {
        section_id: section_id,
      },
      select: {
        id: true,
        activity_name: true,
        deadline_date: true,
        score_number: true,
        student_activity: {
          where: {
            activities: {
              section_id: section_id,
            },
          },
          select: {
            score: true,
            status: true,
          },
        },
      },
    });

    const activityDataList: ActivityData[] = activities.map((activity) => {
      const scores = activity.student_activity
        .map((sa) => (sa.score !== null ? Number(sa.score) : null))
        .filter((score): score is number => score !== null);

      const fullScore = Number(activity.score_number);
      const maxScore = scores.length > 0 ? Math.max(...scores) : 0;
      const minScore = scores.length > 0 ? Math.min(...scores) : 0;
      const meanScore =
        scores.length > 0
          ? scores.reduce((a, b) => a + b, 0) / scores.length
          : 0;

      const submittedCount = activity.student_activity.filter(
        (sa) =>
          sa.status === "SUBMITTED" ||
          sa.status === "GRADED" ||
          sa.status === "GRADING",
      ).length;
      const gradedCount = activity.student_activity.filter(
        (sa) => sa.status === "GRADED",
      ).length;
      const notSubmittedCount = activity.student_activity.filter(
        (sa) => sa.status === "NOT_SUBMITTED",
      ).length;

      return {
        activity_id: activity.id,
        activity_name: activity.activity_name,
        deadline_date: activity.deadline_date,
        full_score: fullScore,
        max_score: maxScore,
        min_score: minScore,
        mean_score: meanScore,
        submitted_count: submittedCount,
        not_submitted_count: notSubmittedCount,
        graded_count: gradedCount,
      };
    });

    return {
      section_id: section_id,
      activities: activityDataList,
    };
  }
}
