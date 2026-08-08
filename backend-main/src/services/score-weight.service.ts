import prisma from "../config/prisma";
import {
  AddScoreWeightBody,
  UpdateScoreWeightBody,
} from "../models/score-weight.model";

export default class ScoreWeightService {
  async addScoreWeight(data: AddScoreWeightBody) {
    const lastSequence = await prisma.subject_score_ratio.aggregate({
      where: {
        section_id: data.section_id,
      },
      _max: {
        sequence_order: true,
      },
    });

    const nextSequence = (lastSequence._max.sequence_order ?? 0) + 1;

    const result = await prisma.subject_score_ratio.create({
      data: {
        score_category: data.score_category,
        // subject_id: data.subject_id,
        section_id: data.section_id,
        sequence_order: nextSequence,
        weight: data.weight,
      },
    });

    return result.score_ratio_id;
  }

  async getScoreWeight(section_id: number) {
    const result = await prisma.subject_score_ratio.findMany({
      where: { section_id: section_id },
      orderBy: { score_ratio_id: "asc" },
    });

    return result;
  }

  async updateScoreWeight(body: UpdateScoreWeightBody) {
    const result = await prisma.subject_score_ratio.update({
      where: { score_ratio_id: body.score_id },
      data: {
        weight: body.weight,
        score_category: body.score_category,
      },
    });

    return result;
  }

  async deleteScoreWeight(score_id: number) {
    const result = await prisma.subject_score_ratio.delete({
      where: { score_ratio_id: score_id },
    });

    await prisma.activities.updateMany({
      where: { score_ratio_id: score_id },
      data: { score_ratio_id: null },
    });

    return result;
  }

  //---------------------------------------------------------------

  async getScoreWeightOptions(section_id: number) {
    const result = await prisma.subject_score_ratio.findMany({
      where: { section_id: section_id },
      orderBy: { score_ratio_id: "asc" },
    });

    return result.map((item) => ({
      value: item.score_ratio_id,
      label: `${item.score_category} (${item.weight}%)`,
    }));
  }
}
