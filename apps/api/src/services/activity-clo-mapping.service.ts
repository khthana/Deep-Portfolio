import prisma from "../config/prisma";
import { CreateActivityCLOMappingBodyReq } from "../models/activity-clo-mapping.model";

export default class ActivityCLOMappingService {
  async createActivityCLOMapping(data: CreateActivityCLOMappingBodyReq) {
    const lastSequence = await prisma.activity_clo_mapping.aggregate({
      where: {
        activity_id: data.activity_id,
      },
      _max: {
        sequence_order: true,
      },
    });

    const nextSequence = (lastSequence._max.sequence_order ?? 0) + 1;

    const activity = await prisma.activities.findUnique({
      where: { id: data.activity_id },
    });

    if (!activity || !activity.score_number)
      throw new Error("Activity not found");

    const score = activity.score_number * (data.weight / 100);

    const result = await prisma.activity_clo_mapping.create({
      data: {
        activity_id: data.activity_id,
        weight: data.weight,
        clo_id: data.clo_id,
        sequence_order: nextSequence,
        score: score,
        score_ratio_id: activity?.score_ratio_id ?? 0,
      },
    });

    return result;
  }

  async getActivity(clo_id: number) {
    const activities = await prisma.activity_clo_mapping.findMany({
      where: { clo_id: clo_id },
      orderBy: { sequence_order: "asc" },
    });

    const result = await Promise.all(
      activities.map(async (activity) => {
        const activityDetail = await prisma.activities.findUnique({
          where: { id: activity.activity_id },
        });

        const rubric = await prisma.rubric_activity_mapping.findFirst({
          where: { activity_id: activity.activity_id },
        });

        const rubric_level = await prisma.rubric_levels.aggregate({
          where: {
            rubric_id: rubric?.id,
          },
          _max: {
            level_no: true,
          },
        });

        return {
          ...activityDetail,
          level_no: rubric_level._max.level_no,
          weight: activity.weight,
        };
      }),
    );

    return result;
  }

  async validateActivityCLOMapping(activity_id: number): Promise<boolean> {
    const activities = await prisma.activity_clo_mapping.findMany({
      where: { activity_id: activity_id },
    });

    return activities.length > 0;
  }
}
