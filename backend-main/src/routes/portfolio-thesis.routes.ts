import { Router } from "express";
import PortfolioThesisController from "../controllers/portfolio-thesis.controller";
import upload from "../middlewares/upload-minio";

const router = Router();
const portfolioThesisController = new PortfolioThesisController();

router.get(
  "/",
  portfolioThesisController.getAllPortfolioThesis.bind(
    portfolioThesisController,
  ),
);

router.get(
  "/:id",
  portfolioThesisController.getPortfolioThesisById.bind(
    portfolioThesisController,
  ),
);

router.post(
  "/",
  upload.array("files"),
  portfolioThesisController.createPortfolioThesis.bind(
    portfolioThesisController,
  ),
);

router.put(
  "/:id",
  upload.array("files"),
  portfolioThesisController.updatePortfolioThesis.bind(
    portfolioThesisController,
  ),
);

router.delete(
  "/:id",
  portfolioThesisController.deletePortfolioThesis.bind(
    portfolioThesisController,
  ),
);

export default router;
