import { Router } from "express";
import PortfolioEducationController from "../controllers/portfolio-education.controller";

const router = Router();
const portfolioEducationController = new PortfolioEducationController();

router.get(
  "/",
  portfolioEducationController.getAllPortfolioEducation.bind(
    portfolioEducationController,
  ),
);

router.get(
  "/:id",
  portfolioEducationController.getPortfolioEducationById.bind(
    portfolioEducationController,
  ),
);

router.post(
  "/",
  portfolioEducationController.createPortfolioEducation.bind(
    portfolioEducationController,
  ),
);

router.put(
  "/:id",
  portfolioEducationController.updatePortfolioEducation.bind(
    portfolioEducationController,
  ),
);

router.delete(
  "/:id",
  portfolioEducationController.deletePortfolioEducation.bind(
    portfolioEducationController,
  ),
);

export default router;
