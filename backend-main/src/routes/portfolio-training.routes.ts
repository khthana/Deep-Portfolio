import { Router } from "express";
import PortfolioTrainingController from "../controllers/portfolio-training.controller";
import upload from "../middlewares/upload-minio";

const router = Router();
const portfolioTrainingController = new PortfolioTrainingController();

router.get(
  "/",
  portfolioTrainingController.getAllPortfolioTraining.bind(
    portfolioTrainingController,
  ),
);

router.get(
  "/:id",
  portfolioTrainingController.getPortfolioTrainingById.bind(
    portfolioTrainingController,
  ),
);

router.post(
  "/",
  upload.array("files"),
  portfolioTrainingController.createPortfolioTraining.bind(
    portfolioTrainingController,
  ),
);

router.put(
  "/:id",
  upload.array("files"),
  portfolioTrainingController.updatePortfolioTraining.bind(
    portfolioTrainingController,
  ),
);

router.delete(
  "/:id",
  portfolioTrainingController.deletePortfolioTraining.bind(
    portfolioTrainingController,
  ),
);

export default router;
