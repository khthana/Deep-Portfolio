import { Router } from "express";
import PortfolioEducationController from "../controllers/portfolio-education.controller";
import {
  createPortfolioEducationBody,
  updatePortfolioEducationBody,
} from "../validation/portfolio-sections.schema";
import {
  portfolioEntryParams,
  portfolioOwnerQuery,
} from "../validation/portfolio.schema";
import { validate } from "../validation/validate";

const router = Router();
const portfolioEducationController = new PortfolioEducationController();

router.get(
  "/",
  validate({ query: portfolioOwnerQuery }),
  portfolioEducationController.getAllPortfolioEducation.bind(
    portfolioEducationController,
  ),
);

router.get(
  "/:id",
  validate({ params: portfolioEntryParams }),
  portfolioEducationController.getPortfolioEducationById.bind(
    portfolioEducationController,
  ),
);

router.post(
  "/",
  validate({ body: createPortfolioEducationBody }),
  portfolioEducationController.createPortfolioEducation.bind(
    portfolioEducationController,
  ),
);

router.put(
  "/:id",
  validate({ params: portfolioEntryParams, body: updatePortfolioEducationBody }),
  portfolioEducationController.updatePortfolioEducation.bind(
    portfolioEducationController,
  ),
);

router.delete(
  "/:id",
  validate({ params: portfolioEntryParams }),
  portfolioEducationController.deletePortfolioEducation.bind(
    portfolioEducationController,
  ),
);

export default router;
