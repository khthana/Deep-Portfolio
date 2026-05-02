import prisma from "../config/prisma";

export default class RubricService {
  async getSharedRubric(program_id: string) {
    const result = await prisma.rubrics.findMany({
      where: { program_id: program_id },
      orderBy: { display_order: "asc" },
    });

    return result;
  }

  async getSharedRubricDetail(rubric_id: number) {
    const result = await prisma.rubric_details.findMany({
      where: { rubric_id: rubric_id },
      orderBy: { display_order: "asc" },
    });

    return result;
  }

  async getRubric(activity_id: number) {
    const result = await prisma.rubric_activity_mapping.findMany({
      where: { activity_id },
      include: {
        rubric_levels: true,
      },
      orderBy: { id: "asc" },
    });

    return result;
  }
}
