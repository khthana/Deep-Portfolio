import { Decimal } from "@prisma/client/runtime/library";
import prisma from "../config/prisma";
import {
  CreatePortfolioEducationReqBody,
  UpdatePortfolioEducationReqBody,
  PortfolioEducationResp,
} from "../models/portfolio-education.model";

/** The row as Prisma hands it over — gpa still a Decimal. */
type PortfolioEducationRow = Omit<PortfolioEducationResp, "gpa"> & {
  gpa: Decimal | null;
};

/**
 * A Decimal serialises to a JSON string, and the frontend's copy of this type
 * says number — so convert it here rather than let the two disagree with the
 * wire. Same treatment /evaluation/list gives its score.
 */
function withNumericGpa(row: PortfolioEducationRow): PortfolioEducationResp {
  return { ...row, gpa: row.gpa !== null ? Number(row.gpa) : null };
}

export default class PortfolioEducationService {
  constructor() {}

  async getAllPortfolioEducation(
    userId: string,
  ): Promise<PortfolioEducationResp[]> {
    const rows = await prisma.portfolio_education.findMany({
      where: { user_id: userId },
      orderBy: { start_year: "desc" },
    });

    return rows.map(withNumericGpa);
  }

  async getPortfolioEducationById(
    id: number,
  ): Promise<PortfolioEducationResp | null> {
    const row = await prisma.portfolio_education.findUnique({
      where: { id },
    });

    return row && withNumericGpa(row);
  }

  async createPortfolioEducation(
    userId: string,
    data: CreatePortfolioEducationReqBody,
  ): Promise<PortfolioEducationResp> {
    const row = await prisma.portfolio_education.create({
      data: {
        user_id: userId,
        ...data,
      },
    });

    return withNumericGpa(row);
  }

  async updatePortfolioEducation(
    id: number,
    data: UpdatePortfolioEducationReqBody,
  ): Promise<PortfolioEducationResp> {
    const row = await prisma.portfolio_education.update({
      where: { id },
      data,
    });

    return withNumericGpa(row);
  }

  async deletePortfolioEducation(id: number): Promise<PortfolioEducationResp> {
    const row = await prisma.portfolio_education.delete({
      where: { id },
    });

    return withNumericGpa(row);
  }
}
