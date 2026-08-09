import { Router } from "express";
import PortfolioPersonalController from "../controllers/portfolio-personal.controller";
import upload from "../middlewares/upload-minio";
import {
  createPortfolioPersonalBody,
  portfolioPersonalBody,
  portfolioPersonalParams,
} from "../validation/portfolio-personal.schema";
import { validate } from "../validation/validate";

const router = Router();
const portfolioPersonalController = new PortfolioPersonalController();

router.get(
  "/:user_id",
  validate({ params: portfolioPersonalParams }),
  portfolioPersonalController.getPortfolioPersonal.bind(
    portfolioPersonalController,
  ),
);

// `upload` first, then `validate`: the fields of a multipart body do not exist
// until multer has read them off the stream.
router.post(
  "/",
  upload.single("file"),
  validate({ body: createPortfolioPersonalBody }),
  portfolioPersonalController.createPortfolioPersonal.bind(
    portfolioPersonalController,
  ),
);

router.put(
  "/:user_id",
  upload.single("file"),
  validate({ params: portfolioPersonalParams, body: portfolioPersonalBody }),
  portfolioPersonalController.updatePortfolioPersonal.bind(
    portfolioPersonalController,
  ),
);

router.delete(
  "/:user_id",
  validate({ params: portfolioPersonalParams }),
  portfolioPersonalController.deletePortfolioPersonal.bind(
    portfolioPersonalController,
  ),
);

router.post(
  "/:user_id/upsert",
  upload.single("file"),
  validate({ params: portfolioPersonalParams, body: portfolioPersonalBody }),
  portfolioPersonalController.upsertPortfolioPersonal.bind(
    portfolioPersonalController,
  ),
);

export default router;
