import { Router } from "express";
import PortfolioAwardController from "../controllers/portfolio-award.controller";
import upload from "../middlewares/upload-minio";

const router = Router();
const portfolioAwardController = new PortfolioAwardController();

router.get(
  "/",
  portfolioAwardController.getAllPortfolioAward.bind(portfolioAwardController),
);

router.get(
  "/:id",
  portfolioAwardController.getPortfolioAwardById.bind(portfolioAwardController),
);

router.post(
  "/",
  upload.array("files"),
  portfolioAwardController.createPortfolioAward.bind(portfolioAwardController),
);

router.put(
  "/:id",
  upload.array("files"),
  portfolioAwardController.updatePortfolioAward.bind(portfolioAwardController),
);

router.delete(
  "/:id",
  portfolioAwardController.deletePortfolioAward.bind(portfolioAwardController),
);

export default router;
