import prisma from "../config/prisma";
import {
  CreatePortfolioEducationReqBody,
  UpdatePortfolioEducationReqBody,
  PortfolioEducationResp,
} from "../models/portfolio-education.model";

export default class PortfolioEducationService {
  constructor() {}

  async getAllPortfolioEducation(
    userId: string,
  ): Promise<PortfolioEducationResp[]> {
    return await prisma.portfolio_education.findMany({
      where: { user_id: userId },
      orderBy: { start_year: "desc" },
    });
  }

  async getPortfolioEducationById(
    id: number,
  ): Promise<PortfolioEducationResp | null> {
    return await prisma.portfolio_education.findUnique({
      where: { id },
    });
  }

  async createPortfolioEducation(
    userId: string,
    data: CreatePortfolioEducationReqBody,
  ): Promise<PortfolioEducationResp> {
    return await prisma.portfolio_education.create({
      data: {
        user_id: userId,
        ...data,
      },
    });
  }

  async updatePortfolioEducation(
    id: number,
    data: UpdatePortfolioEducationReqBody,
  ): Promise<PortfolioEducationResp> {
    return await prisma.portfolio_education.update({
      where: { id },
      data,
    });
  }

  async deletePortfolioEducation(id: number): Promise<PortfolioEducationResp> {
    return await prisma.portfolio_education.delete({
      where: { id },
    });
  }
}
