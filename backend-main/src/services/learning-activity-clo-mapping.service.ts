import prisma from "../config/prisma";
import { CreateLearningActivityCLOMappingBodyReq } from "../models/learning-activity-clo-mapping.model";

export default class LearningActivityCLOMappingService {
  async createLearningActivityCLOMapping(
    data: CreateLearningActivityCLOMappingBodyReq
  ) {
    const lastSequence = await prisma.learning_activity_clo_mapping.aggregate({
      where: {
        learning_activity_id: data.learning_activity_id,
      },
      _max: {
        sequence_order: true,
      },
    });

    const nextSequence = (lastSequence._max.sequence_order ?? 0) + 1;

    const result = await prisma.learning_activity_clo_mapping.create({
      data: {
        learning_activity_id: data.learning_activity_id,
        clo_id: data.clo_id,
        sequence_order: nextSequence,
      },
    });

    return result;
  }

  async getLearningActivity(clo_id: number) {
    const activities = await prisma.learning_activity_clo_mapping.findMany({
      where: { clo_id: clo_id },
      orderBy: { sequence_order: "asc" },
    });

    const result = await Promise.all(
      activities.map(async (activity) => {
        const learningActivityDetail =
          await prisma.learning_activities.findUnique({
            where: { id: activity.learning_activity_id },
          });

        return learningActivityDetail;
      })
    );

    return result;
  }
}
