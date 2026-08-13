import type { learning_outcome_type } from "@prisma/client";
import prisma from "../../src/config/prisma";
import { BASELINE } from "../seed";
import { nextOutcomeCode } from "./ids";

/**
 * Learning outcomes, at both levels the system knows about.
 *
 * A PLO (learning_outcomes) belongs to a programme and is written once by
 * whoever owns the curriculum. A CLO (subject_clo) belongs to one section of
 * one course, and points at the PLO it contributes to — that link is the whole
 * point of the outcome-based model, so createCLO makes a PLO when a case does
 * not name one.
 */

export interface PLOOptions {
  /** programs.program_id. Defaults to the baseline programme, which is also
   *  the one createUser puts people in. */
  program_id?: string;
  outcome_code?: string;
  outcome_title?: string;
  outcome_description?: string;
  outcome_type?: learning_outcome_type;
  /** What GET /course/plo/list is ordered by in the documentation. It is not
   *  what the endpoint actually orders by — see the test. */
  sequence_order?: number;
}

export function createPLO(options: PLOOptions = {}) {
  return prisma.learning_outcomes.create({
    data: {
      program_id: options.program_id ?? BASELINE.program.program_id,
      outcome_code: options.outcome_code ?? nextOutcomeCode(),
      outcome_title: options.outcome_title ?? "ผลลัพธ์การเรียนรู้ตัวอย่าง",
      outcome_description:
        options.outcome_description ?? "คำอธิบายผลลัพธ์การเรียนรู้ตัวอย่าง",
      outcome_type: options.outcome_type ?? "knowledge",
      sequence_order: options.sequence_order ?? 1,
    },
  });
}

export interface CLOOptions {
  /** course_sections.section_id. There is no foreign key on this column, so a
   *  case that only needs a CLO to exist can pass any number. */
  section_id: number;
  /** Free text in the schema, and the endpoints treat it as a display label:
   *  DELETE /course/clo renumbers what is left to "1".."n". Left out, the CLO
   *  gets the next number free in its section, because (section_id,
   *  clo_number) is unique and two CLOs in one section is an ordinary
   *  arrangement. A case about the numbering itself should say the number. */
  clo_number?: string;
  clo_detail?: string;
  /** learning_outcomes.outcome_id. A PLO is created if this is left out. */
  plo_id?: number;
}

export async function createCLO(options: CLOOptions) {
  const plo_id = options.plo_id ?? (await createPLO()).outcome_id;
  const clo_number =
    options.clo_number ?? (await nextCLONumber(options.section_id));

  return prisma.subject_clo.create({
    data: {
      section_id: options.section_id,
      clo_number,
      clo_detail:
        options.clo_detail ?? "รายละเอียดผลลัพธ์การเรียนรู้ของรายวิชา",
      plo_id,
    },
  });
}

/** The lowest label not already used in the section, rather than a count — a
 *  case that arranged "2" by hand must not then be handed "2" again. */
async function nextCLONumber(section_id: number): Promise<string> {
  const taken = new Set(
    (
      await prisma.subject_clo.findMany({
        where: { section_id },
        select: { clo_number: true },
      })
    ).map((clo) => clo.clo_number),
  );

  let next = 1;
  while (taken.has(String(next))) next++;

  return String(next);
}
