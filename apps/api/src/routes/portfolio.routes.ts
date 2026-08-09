import { Router } from "express";
import PortfolioController from "../controllers/portfolio.controller";
import {
  createPortfolioBody,
  generateShareLinkBody,
  portfolioOwnerQuery,
  portfolioParams,
  shareTokenParams,
  updatePortfolioBody,
} from "../validation/portfolio.schema";
import { validate } from "../validation/validate";

const router = Router();
const portfolioController = new PortfolioController();

router.get(
  "/",
  validate({ query: portfolioOwnerQuery }),
  portfolioController.getAllPortfolios.bind(portfolioController),
);
router.get(
  "/templates",
  portfolioController.getAllTemplates.bind(portfolioController),
);

router.get(
  "/public/:token",
  validate({ params: shareTokenParams }),
  portfolioController.getPublicPortfolioById.bind(portfolioController),
);

router.post(
  "/:id/generate-share-link",
  validate({ params: portfolioParams, body: generateShareLinkBody }),
  portfolioController.generateShareLink.bind(portfolioController),
);

router.get(
  "/:id",
  validate({ params: portfolioParams }),
  portfolioController.getPortfolioById.bind(portfolioController),
);

router.post(
  "/",
  validate({ body: createPortfolioBody }),
  portfolioController.createPortfolio.bind(portfolioController),
);

router.put(
  "/:id",
  validate({ params: portfolioParams, body: updatePortfolioBody }),
  portfolioController.updatePortfolio.bind(portfolioController),
);

router.patch(
  "/:id",
  validate({ params: portfolioParams, body: updatePortfolioBody }),
  portfolioController.updatePortfolio.bind(portfolioController),
);

router.delete(
  "/:id",
  validate({ params: portfolioParams }),
  portfolioController.deletePortfolio.bind(portfolioController),
);

export default router;
