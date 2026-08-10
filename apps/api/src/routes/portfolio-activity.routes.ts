import { Router } from "express";
import PortfolioActivityController from "../controllers/portfolio-activity.controller";
import { requireUser } from "../middlewares/auth.middleware";
import {
  entryOwner,
  requireOwnEntry,
  requireSelf,
} from "../middlewares/owner.middleware";
import upload from "../middlewares/upload-minio";
import {
  createPortfolioActivityBody,
  updatePortfolioActivityBody,
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
const portfolioActivityController = new PortfolioActivityController();

router.get(
  "/",
  requireUser,
  validate({ query: portfolioOwnerQuery }),
  requireSelf("query"),
  portfolioActivityController.getAllPortfolioActivity.bind(
    portfolioActivityController,
  ),
);

router.get(
  "/:id",
  requireUser,
  requireOwnEntry(entryOwner.activity),
  validate({ params: portfolioEntryParams }),
  portfolioActivityController.getPortfolioActivityById.bind(
    portfolioActivityController,
  ),
);

router.post(
  "/",
  requireUser,
  upload.array("files"),
  validate({ body: createPortfolioActivityBody }),
  portfolioActivityController.createPortfolioActivity.bind(
    portfolioActivityController,
  ),
);

router.put(
  "/:id",
  requireUser,
  requireOwnEntry(entryOwner.activity),
  upload.array("files"),
  validate({ params: portfolioEntryParams, body: updatePortfolioActivityBody }),
  portfolioActivityController.updatePortfolioActivity.bind(
    portfolioActivityController,
  ),
);

router.delete(
  "/:id",
  requireUser,
  requireOwnEntry(entryOwner.activity),
  validate({ params: portfolioEntryParams }),
  portfolioActivityController.deletePortfolioActivity.bind(
    portfolioActivityController,
  ),
);

export default router;
