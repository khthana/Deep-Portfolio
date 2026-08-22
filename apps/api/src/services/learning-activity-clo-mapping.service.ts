import type {
  CLOMappedLearningActivity,
  LearningActivityCLOMapping,
} from "@deep-portfolio/api-types";
import prisma from "../config/prisma";
import { CreateLearningActivityCLOMappingBodyReq } from "../models/learning-activity-clo-mapping.model";

export default class LearningActivityCLOMappingService {
  async createLearningActivityCLOMapping(
    data: CreateLearningActivityCLOMappingBodyReq,
  ): Promise<LearningActivityCLOMapping> {
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

    // The created row is the response. Six columns and no Decimal among them,
    // so only the two timestamps need saying as the wire says them.
    return {
      ...result,
      created_at: result.created_at?.toISOString() ?? null,
      updated_at: result.updated_at?.toISOString() ?? null,
    };
  }

  async getLearningActivity(
    clo_id: number,
  ): Promise<CLOMappedLearningActivity[]> {
    const activities = await prisma.learning_activity_clo_mapping.findMany({
      where: { clo_id: clo_id },
      orderBy: { sequence_order: "asc" },
      select: { learning_activity_id: true },
    });

    const result = await Promise.all(
      activities.map(async (activity) => {
        // Three columns rather than the row, and not optional, for the two
        // reasons its twin in activity-clo-mapping.service.ts gives: the card
        // draws a name and a description, and the mapping's
        // learning_activity_id is a foreign key with ON DELETE CASCADE
        // (ADR-0047).
        const learningActivityDetail =
          await prisma.learning_activities.findUniqueOrThrow({
            where: { id: activity.learning_activity_id },
            select: { id: true, learning_activity_name: true, detail: true },
          });

        return learningActivityDetail;
      }),
    );

    return result;
  }
}
