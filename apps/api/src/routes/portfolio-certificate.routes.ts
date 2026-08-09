import { Router } from "express";
import PortfolioCertificateController from "../controllers/portfolio-certificate.controller";
import upload from "../middlewares/upload-minio";
import {
  createPortfolioCertificateBody,
  updatePortfolioCertificateBody,
} from "../validation/portfolio-sections.schema";
import {
  portfolioEntryParams,
  portfolioOwnerQuery,
} from "../validation/portfolio.schema";
import { validate } from "../validation/validate";

const router = Router();
const portfolioCertificateController = new PortfolioCertificateController();

router.get(
  "/",
  validate({ query: portfolioOwnerQuery }),
  portfolioCertificateController.getAllPortfolioCertificate.bind(
    portfolioCertificateController,
  ),
);

router.get(
  "/:id",
  validate({ params: portfolioEntryParams }),
  portfolioCertificateController.getPortfolioCertificateById.bind(
    portfolioCertificateController,
  ),
);

// `upload` first, then `validate`: the fields of a multipart body do not exist
// until multer has read them off the stream.
router.post(
  "/",
  upload.array("files"),
  validate({ body: createPortfolioCertificateBody }),
  portfolioCertificateController.createPortfolioCertificate.bind(
    portfolioCertificateController,
  ),
);

router.put(
  "/:id",
  upload.array("files"),
  validate({
    params: portfolioEntryParams,
    body: updatePortfolioCertificateBody,
  }),
  portfolioCertificateController.updatePortfolioCertificate.bind(
    portfolioCertificateController,
  ),
);

router.delete(
  "/:id",
  validate({ params: portfolioEntryParams }),
  portfolioCertificateController.deletePortfolioCertificate.bind(
    portfolioCertificateController,
  ),
);

export default router;
