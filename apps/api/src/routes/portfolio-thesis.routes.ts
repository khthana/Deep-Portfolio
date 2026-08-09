import { Router } from "express";
import PortfolioThesisController from "../controllers/portfolio-thesis.controller";
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

const router = Router();
const portfolioThesisController = new PortfolioThesisController();

router.get(
  "/",
  validate({ query: portfolioOwnerQuery }),
  portfolioThesisController.getAllPortfolioThesis.bind(
    portfolioThesisController,
  ),
);

router.get(
  "/:id",
  validate({ params: portfolioEntryParams }),
  portfolioThesisController.getPortfolioThesisById.bind(
    portfolioThesisController,
  ),
);

// `upload` first, then `validate`: the fields of a multipart body do not exist
// until multer has read them off the stream.
router.post(
  "/",
  upload.array("files"),
  validate({ body: createPortfolioThesisBody }),
  portfolioThesisController.createPortfolioThesis.bind(
    portfolioThesisController,
  ),
);

router.put(
  "/:id",
  upload.array("files"),
  validate({ params: portfolioEntryParams, body: updatePortfolioThesisBody }),
  portfolioThesisController.updatePortfolioThesis.bind(
    portfolioThesisController,
  ),
);

router.delete(
  "/:id",
  validate({ params: portfolioEntryParams }),
  portfolioThesisController.deletePortfolioThesis.bind(
    portfolioThesisController,
  ),
);

export default router;
