import type { PLOResp } from "@deep-portfolio/api-types";
import prisma from "../config/prisma";

export default class PLOService {
  async getPLO(plo_id: number) {
    const result = await prisma.learning_outcomes.findUnique({
      where: { outcome_id: plo_id },
    });

    return {
      outcome_code: result?.outcome_code,
      outcome_title: result?.outcome_title,
      outcome_description: result?.outcome_description,
    };
  }

  async getPLOByCodeAndSubject(plo_id: number) {
    const result = await prisma.learning_outcomes.findUnique({
      where: { outcome_id: plo_id },
    });

    return {
      outcome_code: result?.outcome_code,
      outcome_title: result?.outcome_title,
      outcome_description: result?.outcome_description,
    };
  }

  async getPLOList(program_id: string): Promise<PLOResp[]> {
    const result = await prisma.learning_outcomes.findMany({
      where: { program_id: program_id },
      orderBy: { outcome_id: "asc" },
    });

    // The rows go out whole, as they always have. The two timestamps are spelt
    // out because the annotation is the point: PLOResp says what the caller
    // parses, and a caller parses a string. `toISOString` is what
    // `JSON.stringify` was already calling on the Date, so the response is
    // byte for byte the one this endpoint has always sent.
    return result.map((plo) => ({
      ...plo,
      created_at: plo.created_at?.toISOString() ?? null,
      updated_at: plo.updated_at?.toISOString() ?? null,
    }));
  }
}
