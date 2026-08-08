import prisma from "../config/prisma";
import { AddCLOBody, UpdateCLOBody } from "../models/clo.model";
import PLOService from "./plo.service";

export default class CLOService {
  private readonly ploService: PLOService;

  constructor() {
    this.ploService = new PLOService();
  }

  async addCLO(data: AddCLOBody) {
    const result = await prisma.subject_clo.create({
      data: {
        clo_number: data.clo_number,
        clo_detail: data.clo_detail,
        // created_by: data.created_by,
        plo_id: data.plo_id,
        section_id: data.section_id,
        // year: data.year,
        // semester: data.semester,
        // subject_id: data.subject_id,
        // section_number: data.section_number,
      },
    });

    return result.clo_id;
  }

  async getCLO(section_id: number) {
    const allCLO = await prisma.subject_clo.findMany({
      where: { section_id: section_id },
      orderBy: { clo_id: "asc" },
    });

    const result = await Promise.all(
      allCLO.map(async (clo) => {
        const plo = await this.ploService.getPLO(clo.plo_id ?? 0);

        return {
          ...plo,
          ...clo,
        };
      })
    );

    return result;
  }

  async updateCLO(body: UpdateCLOBody) {
    const result = await prisma.subject_clo.update({
      where: { clo_id: body.id },
      data: {
        clo_detail: body.clo_detail,
        // clo_id: body.clo_id,
        plo_id: body.plo_id,
      },
    });

    return result;
  }

  async deleteCLO(clo_id: number) {
    const clo = await prisma.subject_clo.findUnique({
      where: { clo_id: clo_id },
    });

    const result = await prisma.subject_clo.delete({
      where: { clo_id: clo_id },
    });

    // re-index clo
    const allCLO = await prisma.subject_clo.findMany({
      where: { section_id: clo?.section_id },
    });

    for (let i = 0; i < allCLO.length; i++) {
      await prisma.subject_clo.update({
        where: { clo_id: allCLO[i].clo_id },
        data: { clo_number: (i + 1).toString() },
      });
    }

    return { clo_id: result.clo_id };
  }
}
