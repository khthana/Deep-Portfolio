import { Router } from "express";
import PortfolioThesisController from "../controllers/portfolio-thesis.controller";
import { requireUser } from "../middlewares/auth.middleware";
import {
  entryOwner,
  requireOwnEntry,
  requireSelf,
} from "../middlewares/owner.middleware";
import upload from "../middlewares/upload-minio";
import {
  createPortfolioThesisBody,
  updatePortfolioThesisBody,
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
const portfolioThesisController = new PortfolioThesisController();

router.get(
  "/",
  requireUser,
  validate({ query: portfolioOwnerQuery }),
  requireSelf("query"),
  portfolioThesisController.getAllPortfolioThesis.bind(
    portfolioThesisController,
  ),
);

router.get(
  "/:id",
  requireUser,
  requireOwnEntry(entryOwner.thesis),
  validate({ params: portfolioEntryParams }),
  portfolioThesisController.getPortfolioThesisById.bind(
    portfolioThesisController,
  ),
);

router.post(
  "/",
  requireUser,
  upload.array("files"),
  validate({ body: createPortfolioThesisBody }),
  portfolioThesisController.createPortfolioThesis.bind(
    portfolioThesisController,
  ),
);

router.put(
  "/:id",
  requireUser,
  requireOwnEntry(entryOwner.thesis),
  upload.array("files"),
  validate({ params: portfolioEntryParams, body: updatePortfolioThesisBody }),
  portfolioThesisController.updatePortfolioThesis.bind(
    portfolioThesisController,
  ),
);

router.delete(
  "/:id",
  requireUser,
  requireOwnEntry(entryOwner.thesis),
  validate({ params: portfolioEntryParams }),
  portfolioThesisController.deletePortfolioThesis.bind(
    portfolioThesisController,
  ),
);

export default router;
