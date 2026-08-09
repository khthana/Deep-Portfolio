import { Router } from "express";
import PortfolioActivityController from "../controllers/portfolio-activity.controller";
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

const router = Router();
const portfolioActivityController = new PortfolioActivityController();

router.get(
  "/",
  validate({ query: portfolioOwnerQuery }),
  portfolioActivityController.getAllPortfolioActivity.bind(
    portfolioActivityController,
  ),
);

router.get(
  "/:id",
  validate({ params: portfolioEntryParams }),
  portfolioActivityController.getPortfolioActivityById.bind(
    portfolioActivityController,
  ),
);

// `upload` first, then `validate`: the fields of a multipart body do not exist
// until multer has read them off the stream.
router.post(
  "/",
  upload.array("files"),
  validate({ body: createPortfolioActivityBody }),
  portfolioActivityController.createPortfolioActivity.bind(
    portfolioActivityController,
  ),
);

router.put(
  "/:id",
  upload.array("files"),
  validate({ params: portfolioEntryParams, body: updatePortfolioActivityBody }),
  portfolioActivityController.updatePortfolioActivity.bind(
    portfolioActivityController,
  ),
);

router.delete(
  "/:id",
  validate({ params: portfolioEntryParams }),
  portfolioActivityController.deletePortfolioActivity.bind(
    portfolioActivityController,
  ),
);

export default router;
