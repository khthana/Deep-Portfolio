import { Router } from "express";
import PortfolioCertificateController from "../controllers/portfolio-certificate.controller";
import { requireUser } from "../middlewares/auth.middleware";
import {
  entryOwner,
  requireOwnEntry,
  requireSelf,
} from "../middlewares/owner.middleware";
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

/**
 * Order as in portfolio-education.routes.ts, with `upload` between the
 * ownership check and `validate`: a request that is not the owner's is refused
 * before multer streams a single byte of it into MinIO, and the fields of a
 * multipart body do not exist until multer has read them.
 */

const router = Router();
const portfolioCertificateController = new PortfolioCertificateController();

router.get(
  "/",
  requireUser,
  validate({ query: portfolioOwnerQuery }),
  requireSelf("query"),
  portfolioCertificateController.getAllPortfolioCertificate.bind(
    portfolioCertificateController,
  ),
);

router.get(
  "/:id",
  requireUser,
  requireOwnEntry(entryOwner.certificate),
  validate({ params: portfolioEntryParams }),
  portfolioCertificateController.getPortfolioCertificateById.bind(
    portfolioCertificateController,
  ),
);

router.post(
  "/",
  requireUser,
  upload.array("files"),
  validate({ body: createPortfolioCertificateBody }),
  portfolioCertificateController.createPortfolioCertificate.bind(
    portfolioCertificateController,
  ),
);

router.put(
  "/:id",
  requireUser,
  requireOwnEntry(entryOwner.certificate),
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
  requireUser,
  requireOwnEntry(entryOwner.certificate),
  validate({ params: portfolioEntryParams }),
  portfolioCertificateController.deletePortfolioCertificate.bind(
    portfolioCertificateController,
  ),
);

export default router;
