import type {
  SharedRubric,
  SharedRubricCriterion,
} from "@deep-portfolio/api-types";
import prisma from "../config/prisma";

/**
 * The programme's shared rubrics — reference data a teacher copies criteria
 * out of. Both reads answer every column of their table, and both now say so:
 * the `select` is not narrowing anything today, it is making the promise the
 * type writes down into one the query keeps when the table grows a column
 * (ADR-0044 §1, ADR-0046 §1).
 */
export default class RubricService {
  async getSharedRubric(program_id: string): Promise<SharedRubric[]> {
    return prisma.rubrics.findMany({
      where: { program_id },
      orderBy: { display_order: "asc" },
      select: {
        id: true,
        rubric_code: true,
        rubric_name_en: true,
        rubric_name_th: true,
        display_order: true,
        created_by: true,
        updated_by: true,
        program_id: true,
      },
    });
  }

  async getSharedRubricDetail(
    rubric_id: number,
  ): Promise<SharedRubricCriterion[]> {
    const result = await prisma.rubric_details.findMany({
      where: { rubric_id },
      orderBy: { display_order: "asc" },
      select: {
        id: true,
        rubric_id: true,
        criteria_name_en: true,
        criteria_name_th: true,
        level_4_description: true,
        level_3_description: true,
        level_2_description: true,
        level_1_description: true,
        weight: true,
        display_order: true,
        created_by: true,
        updated_by: true,
      },
    });

    // weight is Decimal(5,2), which res.json writes as a string (#33).
    return result.map((detail) => ({
      ...detail,
      weight: detail.weight !== null ? Number(detail.weight) : null,
    }));
  }
}
