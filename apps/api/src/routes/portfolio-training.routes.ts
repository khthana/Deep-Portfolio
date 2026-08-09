import { Router } from "express";
import PortfolioTrainingController from "../controllers/portfolio-training.controller";
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

const router = Router();
const portfolioTrainingController = new PortfolioTrainingController();

router.get(
  "/",
  validate({ query: portfolioOwnerQuery }),
  portfolioTrainingController.getAllPortfolioTraining.bind(
    portfolioTrainingController,
  ),
);

router.get(
  "/:id",
  validate({ params: portfolioEntryParams }),
  portfolioTrainingController.getPortfolioTrainingById.bind(
    portfolioTrainingController,
  ),
);

// `upload` first, then `validate`: the fields of a multipart body do not exist
// until multer has read them off the stream.
router.post(
  "/",
  upload.array("files"),
  validate({ body: createPortfolioTrainingBody }),
  portfolioTrainingController.createPortfolioTraining.bind(
    portfolioTrainingController,
  ),
);

router.put(
  "/:id",
  upload.array("files"),
  validate({ params: portfolioEntryParams, body: updatePortfolioTrainingBody }),
  portfolioTrainingController.updatePortfolioTraining.bind(
    portfolioTrainingController,
  ),
);

router.delete(
  "/:id",
  validate({ params: portfolioEntryParams }),
  portfolioTrainingController.deletePortfolioTraining.bind(
    portfolioTrainingController,
  ),
);

export default router;
