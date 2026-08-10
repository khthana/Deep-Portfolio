import { Router } from "express";
import PortfolioTrainingController from "../controllers/portfolio-training.controller";
import { requireUser } from "../middlewares/auth.middleware";
import {
  entryOwner,
  requireOwnEntry,
  requireSelf,
} from "../middlewares/owner.middleware";
import upload from "../middlewares/upload-minio";
import {
  createPortfolioTrainingBody,
  updatePortfolioTrainingBody,
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
const portfolioTrainingController = new PortfolioTrainingController();

router.get(
  "/",
  requireUser,
  validate({ query: portfolioOwnerQuery }),
  requireSelf("query"),
  portfolioTrainingController.getAllPortfolioTraining.bind(
    portfolioTrainingController,
  ),
);

router.get(
  "/:id",
  requireUser,
  requireOwnEntry(entryOwner.training),
  validate({ params: portfolioEntryParams }),
  portfolioTrainingController.getPortfolioTrainingById.bind(
    portfolioTrainingController,
  ),
);

router.post(
  "/",
  requireUser,
  upload.array("files"),
  validate({ body: createPortfolioTrainingBody }),
  portfolioTrainingController.createPortfolioTraining.bind(
    portfolioTrainingController,
  ),
);

router.put(
  "/:id",
  requireUser,
  requireOwnEntry(entryOwner.training),
  upload.array("files"),
  validate({ params: portfolioEntryParams, body: updatePortfolioTrainingBody }),
  portfolioTrainingController.updatePortfolioTraining.bind(
    portfolioTrainingController,
  ),
);

router.delete(
  "/:id",
  requireUser,
  requireOwnEntry(entryOwner.training),
  validate({ params: portfolioEntryParams }),
  portfolioTrainingController.deletePortfolioTraining.bind(
    portfolioTrainingController,
  ),
);

export default router;
