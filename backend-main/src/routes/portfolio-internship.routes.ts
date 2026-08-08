import { Router } from "express";
import PortfolioInternshipController from "../controllers/portfolio-internship.controller";
import upload from "../middlewares/upload-minio";

const router = Router();
const portfolioInternshipController = new PortfolioInternshipController();

router.get(
  "/",
  portfolioInternshipController.getAllPortfolioInternship.bind(
    portfolioInternshipController,
  ),
);

router.get(
  "/:id",
  portfolioInternshipController.getPortfolioInternshipById.bind(
    portfolioInternshipController,
  ),
);

router.post(
  "/",
  upload.array("files"),
  portfolioInternshipController.createPortfolioInternship.bind(
    portfolioInternshipController,
  ),
);

router.put(
  "/:id",
  upload.array("files"),
  portfolioInternshipController.updatePortfolioInternship.bind(
    portfolioInternshipController,
  ),
);

router.delete(
  "/:id",
  portfolioInternshipController.deletePortfolioInternship.bind(
    portfolioInternshipController,
  ),
);

export default router;
