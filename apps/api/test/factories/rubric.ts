import prisma from "../../src/config/prisma";
import { BASELINE } from "../seed";
import { createActivity } from "./activity";
import { nextRubricCode } from "./ids";

/**
 * Rubrics, of which this schema has two unrelated kinds.
 *
 * A **shared rubric** (`rubrics` + `rubric_details`) belongs to a programme and
 * is written once by whoever owns the curriculum. It has a fixed four levels,
 * one column each, and nothing points at it — a teacher reads it and copies
 * what they want. That is all /rubric serves.
 *
 * An **activity rubric** (`rubric_activity_mapping` + `rubric_levels`) belongs
 * to one piece of work, and its levels are rows rather than columns, so it can
 * have as many as the teacher wants. This is the one grading actually scores
 * against, and the one POST /activity writes.
 *
 * The two share a word and nothing else. Neither can be converted into the
 * other by any endpoint in the system.
 */

export interface SharedRubricOptions {
  /** programs.program_id. Defaults to the baseline programme, which is the one
   *  GET /rubric/shared-rubric is asked about in most cases. */
  program_id?: string;
  rubric_code?: string;
  rubric_name_th?: string;
  rubric_name_en?: string;
  /** What GET /rubric/shared-rubric orders by. */
  display_order?: number;
}

export function createSharedRubric(options: SharedRubricOptions = {}) {
  return prisma.rubrics.create({
    data: {
      program_id: options.program_id ?? BASELINE.program.program_id,
      rubric_code: options.rubric_code ?? nextRubricCode(),
      rubric_name_th: options.rubric_name_th ?? "เกณฑ์การประเมินกลาง",
      rubric_name_en: options.rubric_name_en ?? "Shared rubric",
      display_order: options.display_order ?? 0,
    },
  });
}

export interface SharedRubricDetailOptions {
  /** rubrics.id. Required: a detail row without its rubric is not something
   *  any case is about. */
  rubric_id: number;
  criteria_name_th?: string;
  criteria_name_en?: string;
  /** Four levels, four columns. Level 4 is the best. */
  level_4_description?: string;
  level_3_description?: string;
  level_2_description?: string;
  level_1_description?: string;
  weight?: number;
  /** What GET /rubric/shared-rubric/detail orders by. */
  display_order?: number;
}

export function createSharedRubricDetail(options: SharedRubricDetailOptions) {
  return prisma.rubric_details.create({
    data: {
      rubric_id: options.rubric_id,
      criteria_name_th: options.criteria_name_th ?? "ความถูกต้อง",
      criteria_name_en: options.criteria_name_en ?? "Correctness",
      level_4_description: options.level_4_description ?? "ถูกต้องครบถ้วน",
      level_3_description: options.level_3_description ?? "ถูกต้องเป็นส่วนใหญ่",
      level_2_description: options.level_2_description ?? "ถูกต้องบางส่วน",
      level_1_description: options.level_1_description ?? "ยังไม่ถูกต้อง",
      weight: options.weight ?? 1,
      display_order: options.display_order ?? 0,
    },
  });
}

export interface ActivityRubricLevel {
  level_no: number;
  description: string;
}

export interface ActivityRubricOptions {
  /** activities.id. An activity is created if this is left out. */
  activity_id?: number;
  criteria?: string;
  /** Percent of the activity's score this criterion carries. */
  weight?: number;
  /** Highest level_no first or last makes no difference — nothing orders by
   *  it. Left out, the criterion gets the four levels the UI defaults to. */
  levels?: ActivityRubricLevel[];
}

export async function createActivityRubric(
  options: ActivityRubricOptions = {},
) {
  const activity_id = options.activity_id ?? (await createActivity()).id;

  const rubric = await prisma.rubric_activity_mapping.create({
    data: {
      activity_id,
      criteria: options.criteria ?? "ความถูกต้อง",
      weight: options.weight ?? 100,
    },
  });

  const levels = options.levels ?? [
    { level_no: 1, description: "ยังไม่ถูกต้อง" },
    { level_no: 2, description: "ถูกต้องบางส่วน" },
    { level_no: 3, description: "ถูกต้องเป็นส่วนใหญ่" },
    { level_no: 4, description: "ถูกต้องครบถ้วน" },
  ];

  await prisma.rubric_levels.createMany({
    data: levels.map((level) => ({ rubric_id: rubric.id, ...level })),
  });

  return rubric;
}
