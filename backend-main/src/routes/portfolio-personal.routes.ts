import { Router } from "express";
import PortfolioPersonalController from "../controllers/portfolio-personal.controller";
import upload from "../middlewares/upload-minio";

const router = Router();
const portfolioPersonalController = new PortfolioPersonalController();

router.get(
  "/:user_id",
  portfolioPersonalController.getPortfolioPersonal.bind(
    portfolioPersonalController,
  ),
);

router.post(
  "/",
  upload.single("file"),
  portfolioPersonalController.createPortfolioPersonal.bind(
    portfolioPersonalController,
  ),
);

router.put(
  "/:user_id",
  upload.single("file"),
  portfolioPersonalController.updatePortfolioPersonal.bind(
    portfolioPersonalController,
  ),
);

router.delete(
  "/:user_id",
  portfolioPersonalController.deletePortfolioPersonal.bind(
    portfolioPersonalController,
  ),
);

router.post(
  "/:user_id/upsert",
  upload.single("file"),
  portfolioPersonalController.upsertPortfolioPersonal.bind(
    portfolioPersonalController,
  ),
);

export default router;
