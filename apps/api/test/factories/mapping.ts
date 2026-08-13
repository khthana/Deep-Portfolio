import prisma from "../../src/config/prisma";
import { createActivity, createLearningActivity } from "./activity";
import { createCLO } from "./outcome";
import { createScoreWeight } from "./score-weight";

/**
 * What a piece of work is supposed to measure — the link between an activity
 * and a CLO, which is the join the whole outcome-based model rests on.
 *
 * The two tables are not symmetrical. An activity carries a score, so
 * `activity_clo_mapping` records how much of that score this CLO is worth and
 * caches the resulting number; it also has a real foreign key to the score
 * category, which is why the factory arranges one. A learning activity is not
 * graded, so `learning_activity_clo_mapping` is the link and nothing else.
 *
 * `clo_id` is a SmallInt with no foreign key behind it in either table, so a
 * mapping can point at a CLO that does not exist and nothing will complain.
 */

export interface ActivityCLOMappingOptions {
  /** activities.id. An activity is created if this is left out. */
  activity_id?: number;
  /** subject_clo.clo_id. A CLO is created if this is left out. */
  clo_id?: number;
  /** Percent of the activity's score. */
  weight?: number;
  /** Assigned by the endpoint — highest in this activity, plus one — and the
   *  factory does the same. */
  sequence_order?: number;
  /** subject_score_ratio.score_ratio_id. A real foreign key, and NOT NULL, so
   *  one is created in the activity's section if the case does not name it. */
  score_ratio_id?: number;
  /** The endpoint computes this from the activity's score and the weight; a
   *  case that is not about the arithmetic can leave it. */
  score?: number;
}

export async function mapActivityToCLO(
  options: ActivityCLOMappingOptions = {},
) {
  const activity = options.activity_id
    ? await prisma.activities.findUniqueOrThrow({
        where: { id: options.activity_id },
      })
    : await createActivity();

  const section_id = activity.section_id!;

  const score_ratio_id =
    options.score_ratio_id ??
    activity.score_ratio_id ??
    (await createScoreWeight({ section_id })).score_ratio_id;

  const clo_id = options.clo_id ?? (await createCLO({ section_id })).clo_id;

  const sequence_order =
    options.sequence_order ?? (await nextSequenceOrder(activity.id));

  return prisma.activity_clo_mapping.create({
    data: {
      activity_id: activity.id,
      clo_id,
      weight: options.weight ?? 100,
      sequence_order,
      score_ratio_id,
      score: options.score ?? 0,
    },
  });
}

async function nextSequenceOrder(activity_id: number): Promise<number> {
  const highest = await prisma.activity_clo_mapping.aggregate({
    where: { activity_id },
    _max: { sequence_order: true },
  });

  return (highest._max.sequence_order ?? 0) + 1;
}

export interface LearningActivityCLOMappingOptions {
  /** learning_activities.id. One is created if this is left out. */
  learning_activity_id?: number;
  /** subject_clo.clo_id. A CLO is created if this is left out. */
  clo_id?: number;
  sequence_order?: number;
}

export async function mapLearningActivityToCLO(
  options: LearningActivityCLOMappingOptions = {},
) {
  const activity = options.learning_activity_id
    ? await prisma.learning_activities.findUniqueOrThrow({
        where: { id: options.learning_activity_id },
      })
    : await createLearningActivity();

  const clo_id =
    options.clo_id ??
    (await createCLO({ section_id: activity.section_id })).clo_id;

  const sequence_order =
    options.sequence_order ?? (await nextLearningSequenceOrder(activity.id));

  return prisma.learning_activity_clo_mapping.create({
    data: {
      learning_activity_id: activity.id,
      clo_id,
      sequence_order,
    },
  });
}

async function nextLearningSequenceOrder(
  learning_activity_id: number,
): Promise<number> {
  const highest = await prisma.learning_activity_clo_mapping.aggregate({
    where: { learning_activity_id },
    _max: { sequence_order: true },
  });

  return (highest._max.sequence_order ?? 0) + 1;
}
