import { Router } from "express";
import PortfolioActivityController from "../controllers/portfolio-activity.controller";
import upload from "../middlewares/upload-minio";

const router = Router();
const portfolioActivityController = new PortfolioActivityController();

router.get(
  "/",
  portfolioActivityController.getAllPortfolioActivity.bind(
    portfolioActivityController,
  ),
);

router.get(
  "/:id",
  portfolioActivityController.getPortfolioActivityById.bind(
    portfolioActivityController,
  ),
);

router.post(
  "/",
  upload.array("files"),
  portfolioActivityController.createPortfolioActivity.bind(
    portfolioActivityController,
  ),
);

router.put(
  "/:id",
  upload.array("files"),
  portfolioActivityController.updatePortfolioActivity.bind(
    portfolioActivityController,
  ),
);

router.delete(
  "/:id",
  portfolioActivityController.deletePortfolioActivity.bind(
    portfolioActivityController,
  ),
);

export default router;
