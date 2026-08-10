import prisma from "../config/prisma";
import {
  GetStudentEvaluationList,
  StudentEvaluationData,
} from "../models/evaluation.model";
import { checkIsOverAnnouncementDate } from "../utils/check-announcement-date";
import { GradebookService } from "./gradebook.service";

export default class EvaluationService {
  private readonly gradebookService: GradebookService;

  constructor() {
    this.gradebookService = new GradebookService();
  }

  async getStudentEvaluationList(
    student_id: string,
    section_id: number,
  ): Promise<GetStudentEvaluationList> {
    const activities =
      await this.gradebookService.getGradebookPerActivity(section_id);

    const learningActivities = await prisma.learning_activities.findMany({
      where: {
        section_id: section_id,

        student_learning_activity: {
          some: {
            student_id: student_id,
          },
        },
      },
      select: {
        id: true,
        learning_activity_name: true,
        announcement_date: true,

        student_learning_activity: {
          select: {
            status: true,
            id: true,
            student_id: true,
          },
        },
      },
    });

    // console.log("activities : ", activities);

    // Annotated rather than cast: `as StudentEvaluationData` told the compiler
    // the row had every field of the type when it has five, which is how the
    // type came to disagree with the wire (#28). The annotation checks the same
    // shape from the other side, so a missing field is an error here.
    const learningActivityResults = learningActivities.map(
      (activity): StudentEvaluationData | null => {
        const studentData = activity.student_learning_activity.find(
          (data) => data.student_id === student_id,
        );

        // The query only asks for activities this student has a row on, so the
        // find always hits; this is the compiler's proof of it, not a case.
        if (!studentData) return null;

        return checkIsOverAnnouncementDate(activity.announcement_date)
          ? {
              id: studentData.id,
              activity_id: activity.id,
              activity_name: activity.learning_activity_name,
              status: studentData.status,
              type: "learning_activity",
            }
          : null;
      },
    );

    const activityResults = await Promise.all(
      activities.activities.map(
        async (activity): Promise<StudentEvaluationData | null> => {
          const studentActivity = await prisma.student_activity.findFirst({
            where: {
              student_id,
              activities: {
                id: activity.activity_id,
              },
            },
            select: {
              id: true,
              score: true,
              status: true,

              activities: {
                select: {
                  announcement_date: true,
                },
              },
            },
          });

          if (!studentActivity) return null;

          return checkIsOverAnnouncementDate(
            studentActivity.activities.announcement_date,
          )
            ? {
                ...activity,
                id: studentActivity.id,
                // A Decimal serialises to a JSON string, and both this response
                // type and the frontend's copy of it say number — so convert it
                // here rather than let the two disagree with the wire.
                score:
                  studentActivity.score !== null
                    ? Number(studentActivity.score)
                    : null,
                status: studentActivity.status,
                type: "activity",
              }
            : null;
        },
      ),
    );

    return {
      evaluations: [
        ...activityResults.filter((activity) => activity !== null),
        ...learningActivityResults.filter((activity) => activity !== null),
      ],
    };
  }
}
