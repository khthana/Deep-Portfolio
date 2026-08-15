import type {
  GradebookActivity,
  GradebookPerActivityResp,
  GradebookPerStudentResp,
  GradebookStudent,
} from "@deep-portfolio/api-types";
import prisma from "../config/prisma";

/**
 * A score is Decimal(5,2) in the database — a whole number of hundredths — but
 * an ordinary double by the time it reaches here, and a double cannot hold
 * 10.01. Both views therefore do their arithmetic in hundredths, where every
 * score is an integer and adding is exact. Only a mean can land between two
 * hundredths, and `Math.round` settles that half upwards; rounding the double
 * instead would settle it whichever way the representation error happened to
 * fall, which for a mean of 1.00 and 1.01 is downwards.
 */
function toHundredths(score: number): number {
  return Math.round(score * 100);
}

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

    const studentMap = new Map<string, GradebookStudent>();

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

      // Whether work was late is a fact about when it was handed in, so it is
      // decided by the dates alone. Marking it does not change it.
      if (sa.status === "NOT_SUBMITTED") {
        studentData.missing_submissions++;
      } else if (
        sa.activities.deadline_date &&
        sa.submitted_at &&
        sa.submitted_at > sa.activities.deadline_date
      ) {
        studentData.late_submissions++;
      } else {
        studentData.on_time_submissions++;
      }

      const score = sa.score ? Number(sa.score) : null;

      studentData.activities.push({
        activity_id: sa.activities.id,
        activity_name: sa.activities.activity_name,
        full_score: Number(sa.activities.score_number),
        score: score,
        status: sa.status,
      });
    }

    const studentsResult = Array.from(studentMap.values());

    // The total is the marks already collected above, added up once they are
    // all in — 1000 + 1001 is exactly 2001, where 10 + 10.01 is not 20.01.
    for (const student of studentsResult) {
      const hundredths = student.activities.reduce(
        (total, activity) =>
          total + (activity.score !== null ? toHundredths(activity.score) : 0),
        0,
      );
      student.total_score = hundredths / 100;
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

    const activityDataList: GradebookActivity[] = activities.map((activity) => {
      const scores = activity.student_activity
        .map((sa) => (sa.score !== null ? Number(sa.score) : null))
        .filter((score): score is number => score !== null);

      // No marks, no statistics. These three used to fall back to 0, which is
      // also a mark a class can get, so work nobody had looked at yet and work
      // everybody failed came back identical (#28). null says there is nothing
      // to compute; the counts below still answer, because a submission waiting
      // to be marked is a fact either way.
      const fullScore = Number(activity.score_number);
      const maxScore = scores.length > 0 ? Math.max(...scores) : null;
      const minScore = scores.length > 0 ? Math.min(...scores) : null;
      const meanScore =
        scores.length > 0
          ? Math.round(
              scores.reduce((total, score) => total + toHundredths(score), 0) /
                scores.length,
            ) / 100
          : null;

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
        // Written out here rather than left to res.json(): the same bytes
        // JSON.stringify was already producing from the Date, and what lets
        // the compiler hold this against the shared type, which says string
        // because that is what a caller parses.
        deadline_date: activity.deadline_date?.toISOString() ?? null,
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
