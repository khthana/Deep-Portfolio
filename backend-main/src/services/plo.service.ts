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

  async getPLOList(program_id: string) {
    const result = await prisma.learning_outcomes.findMany({
      where: { program_id: program_id },
      orderBy: { outcome_id: "asc" },
    });

    return result;
  }
}
