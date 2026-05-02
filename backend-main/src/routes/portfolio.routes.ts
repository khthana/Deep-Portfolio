import { Router } from "express";
import PortfolioController from "../controllers/portfolio.controller";

const router = Router();
const portfolioController = new PortfolioController();

router.get("/", portfolioController.getAllPortfolios.bind(portfolioController));
router.get(
  "/templates",
  portfolioController.getAllTemplates.bind(portfolioController),
);

router.get(
  "/public/:token",
  portfolioController.getPublicPortfolioById.bind(portfolioController),
);

router.post(
  "/:id/generate-share-link",
  portfolioController.generateShareLink.bind(portfolioController),
);

router.get(
  "/:id",
  portfolioController.getPortfolioById.bind(portfolioController),
);

router.post("/", portfolioController.createPortfolio.bind(portfolioController));

router.put(
  "/:id",
  portfolioController.updatePortfolio.bind(portfolioController),
);

router.patch(
  "/:id",
  portfolioController.updatePortfolio.bind(portfolioController),
);

router.delete(
  "/:id",
  portfolioController.deletePortfolio.bind(portfolioController),
);

export default router;
