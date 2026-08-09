import { Router } from "express";
import PortfolioInternshipController from "../controllers/portfolio-internship.controller";
import upload from "../middlewares/upload-minio";
import {
  createPortfolioInternshipBody,
  updatePortfolioInternshipBody,
} from "../validation/portfolio-sections.schema";
import {
  portfolioEntryParams,
  portfolioOwnerQuery,
} from "../validation/portfolio.schema";
import { validate } from "../validation/validate";

const router = Router();
const portfolioInternshipController = new PortfolioInternshipController();

router.get(
  "/",
  validate({ query: portfolioOwnerQuery }),
  portfolioInternshipController.getAllPortfolioInternship.bind(
    portfolioInternshipController,
  ),
);

router.get(
  "/:id",
  validate({ params: portfolioEntryParams }),
  portfolioInternshipController.getPortfolioInternshipById.bind(
    portfolioInternshipController,
  ),
);

// `upload` first, then `validate`: the fields of a multipart body do not exist
// until multer has read them off the stream.
router.post(
  "/",
  upload.array("files"),
  validate({ body: createPortfolioInternshipBody }),
  portfolioInternshipController.createPortfolioInternship.bind(
    portfolioInternshipController,
  ),
);

router.put(
  "/:id",
  upload.array("files"),
  validate({
    params: portfolioEntryParams,
    body: updatePortfolioInternshipBody,
  }),
  portfolioInternshipController.updatePortfolioInternship.bind(
    portfolioInternshipController,
  ),
);

router.delete(
  "/:id",
  validate({ params: portfolioEntryParams }),
  portfolioInternshipController.deletePortfolioInternship.bind(
    portfolioInternshipController,
  ),
);

export default router;
