import { Router } from "express";
import PortfolioInternshipController from "../controllers/portfolio-internship.controller";
import { requireUser } from "../middlewares/auth.middleware";
import {
  entryOwner,
  requireOwnEntry,
  requireSelf,
} from "../middlewares/owner.middleware";
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

/**
 * Order as in portfolio-education.routes.ts, with `upload` between the
 * ownership check and `validate`: a request that is not the owner's is refused
 * before multer streams a single byte of it into MinIO, and the fields of a
 * multipart body do not exist until multer has read them.
 */

const router = Router();
const portfolioInternshipController = new PortfolioInternshipController();

router.get(
  "/",
  requireUser,
  validate({ query: portfolioOwnerQuery }),
  requireSelf("query"),
  portfolioInternshipController.getAllPortfolioInternship.bind(
    portfolioInternshipController,
  ),
);

router.get(
  "/:id",
  requireUser,
  requireOwnEntry(entryOwner.internship),
  validate({ params: portfolioEntryParams }),
  portfolioInternshipController.getPortfolioInternshipById.bind(
    portfolioInternshipController,
  ),
);

router.post(
  "/",
  requireUser,
  upload.array("files"),
  validate({ body: createPortfolioInternshipBody }),
  portfolioInternshipController.createPortfolioInternship.bind(
    portfolioInternshipController,
  ),
);

router.put(
  "/:id",
  requireUser,
  requireOwnEntry(entryOwner.internship),
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
  requireUser,
  requireOwnEntry(entryOwner.internship),
  validate({ params: portfolioEntryParams }),
  portfolioInternshipController.deletePortfolioInternship.bind(
    portfolioInternshipController,
  ),
);

export default router;
