import type { subject_score_ratio } from "@prisma/client";
import prisma from "../config/prisma";
import type { ScoreWeightDetail } from "@deep-portfolio/api-types";
import {
  AddScoreWeightBody,
  UpdateScoreWeightBody,
} from "../models/score-weight.model";

/**
 * One row of `subject_score_ratio` as a caller reads it.
 *
 * Three of the five endpoints hand the row over whole — `GET`, and the `PUT`
 * and `DELETE` that answer the row they touched — so the only thing between
 * Prisma and the wire is the two dates. `JSON.stringify` would turn them into
 * the same strings anyway; doing it here is what lets the return type say
 * `string | null` and be true (#68).
 */
const toScoreWeightDetail = (row: subject_score_ratio): ScoreWeightDetail => ({
  ...row,
  created_at: row.created_at?.toISOString() ?? null,
  updated_at: row.updated_at?.toISOString() ?? null,
});

export default class ScoreWeightService {
  async addScoreWeight(data: AddScoreWeightBody): Promise<number> {
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

  async getScoreWeight(section_id: number): Promise<ScoreWeightDetail[]> {
    const result = await prisma.subject_score_ratio.findMany({
      where: { section_id: section_id },
      orderBy: { score_ratio_id: "asc" },
    });

    return result.map(toScoreWeightDetail);
  }

  async updateScoreWeight(
    body: UpdateScoreWeightBody,
  ): Promise<ScoreWeightDetail> {
    const result = await prisma.subject_score_ratio.update({
      where: { score_ratio_id: body.score_id },
      data: {
        weight: body.weight,
        score_category: body.score_category,
      },
    });

    return toScoreWeightDetail(result);
  }

  async deleteScoreWeight(score_id: number): Promise<ScoreWeightDetail> {
    const result = await prisma.subject_score_ratio.delete({
      where: { score_ratio_id: score_id },
    });

    await prisma.activities.updateMany({
      where: { score_ratio_id: score_id },
      data: { score_ratio_id: null },
    });

    return toScoreWeightDetail(result);
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
