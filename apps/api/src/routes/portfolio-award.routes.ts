import { Router } from "express";
import PortfolioAwardController from "../controllers/portfolio-award.controller";
import { requireUser } from "../middlewares/auth.middleware";
import {
  entryOwner,
  requireOwnEntry,
  requireSelf,
} from "../middlewares/owner.middleware";
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

/**
 * Order as in portfolio-education.routes.ts, with `upload` between the
 * ownership check and `validate`: a request that is not the owner's is refused
 * before multer streams a single byte of it into MinIO, and the fields of a
 * multipart body do not exist until multer has read them.
 */

const router = Router();
const portfolioAwardController = new PortfolioAwardController();

router.get(
  "/",
  requireUser,
  validate({ query: portfolioOwnerQuery }),
  requireSelf("query"),
  portfolioAwardController.getAllPortfolioAward.bind(portfolioAwardController),
);

router.get(
  "/:id",
  requireUser,
  requireOwnEntry(entryOwner.award),
  validate({ params: portfolioEntryParams }),
  portfolioAwardController.getPortfolioAwardById.bind(portfolioAwardController),
);

router.post(
  "/",
  requireUser,
  upload.array("files"),
  validate({ body: createPortfolioAwardBody }),
  portfolioAwardController.createPortfolioAward.bind(portfolioAwardController),
);

router.put(
  "/:id",
  requireUser,
  requireOwnEntry(entryOwner.award),
  upload.array("files"),
  validate({ params: portfolioEntryParams, body: updatePortfolioAwardBody }),
  portfolioAwardController.updatePortfolioAward.bind(portfolioAwardController),
);

router.delete(
  "/:id",
  requireUser,
  requireOwnEntry(entryOwner.award),
  validate({ params: portfolioEntryParams }),
  portfolioAwardController.deletePortfolioAward.bind(portfolioAwardController),
);

export default router;
