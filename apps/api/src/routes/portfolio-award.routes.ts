import { Router } from "express";
import PortfolioAwardController from "../controllers/portfolio-award.controller";
import upload from "../middlewares/upload-minio";
import {
  createPortfolioAwardBody,
  updatePortfolioAwardBody,
} from "../validation/portfolio-sections.schema";
import {
  portfolioEntryParams,
  portfolioOwnerQuery,
} from "../validation/portfolio.schema";
import { validate } from "../validation/validate";

const router = Router();
const portfolioAwardController = new PortfolioAwardController();

router.get(
  "/",
  validate({ query: portfolioOwnerQuery }),
  portfolioAwardController.getAllPortfolioAward.bind(portfolioAwardController),
);

router.get(
  "/:id",
  validate({ params: portfolioEntryParams }),
  portfolioAwardController.getPortfolioAwardById.bind(portfolioAwardController),
);

// `upload` first, then `validate`: the fields of a multipart body do not exist
// until multer has read them off the stream.
router.post(
  "/",
  upload.array("files"),
  validate({ body: createPortfolioAwardBody }),
  portfolioAwardController.createPortfolioAward.bind(portfolioAwardController),
);

router.put(
  "/:id",
  upload.array("files"),
  validate({ params: portfolioEntryParams, body: updatePortfolioAwardBody }),
  portfolioAwardController.updatePortfolioAward.bind(portfolioAwardController),
);

router.delete(
  "/:id",
  validate({ params: portfolioEntryParams }),
  portfolioAwardController.deletePortfolioAward.bind(portfolioAwardController),
);

export default router;
