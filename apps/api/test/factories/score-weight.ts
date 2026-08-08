import prisma from "../../src/config/prisma";

/**
 * The score categories of a section and how much each is worth —
 * subject_score_ratio, "สัดส่วนคะแนน" in the UI.
 *
 * sequence_order is assigned by the endpoint, not by the caller: POST
 * /score-weight takes the highest one in the section and adds one. The factory
 * does the same by default, so a case that appends a row through the endpoint
 * and a case that arranges one directly end up with the same numbering.
 */

export interface ScoreWeightOptions {
  /** course_sections.section_id. Foreign key, and it cascades — deleting a
   *  section takes its score weights with it. */
  section_id: number;
  score_category?: string;
  /** Percent. Nothing enforces that a section's weights add up to 100. */
  weight?: number;
  sequence_order?: number;
}

export async function createScoreWeight(options: ScoreWeightOptions) {
  const sequence_order =
    options.sequence_order ?? (await nextSequenceOrder(options.section_id));

  return prisma.subject_score_ratio.create({
    data: {
      section_id: options.section_id,
      score_category: options.score_category ?? "งานที่มอบหมาย",
      weight: options.weight ?? 20,
      sequence_order,
    },
  });
}

async function nextSequenceOrder(section_id: number): Promise<number> {
  const highest = await prisma.subject_score_ratio.aggregate({
    where: { section_id },
    _max: { sequence_order: true },
  });

  return (highest._max.sequence_order ?? 0) + 1;
}
