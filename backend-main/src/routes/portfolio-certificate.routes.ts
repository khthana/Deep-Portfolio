import { Router } from "express";
import PortfolioCertificateController from "../controllers/portfolio-certificate.controller";
import upload from "../middlewares/upload-minio";

const router = Router();
const portfolioCertificateController = new PortfolioCertificateController();

router.get(
  "/",
  portfolioCertificateController.getAllPortfolioCertificate.bind(
    portfolioCertificateController,
  ),
);

router.get(
  "/:id",
  portfolioCertificateController.getPortfolioCertificateById.bind(
    portfolioCertificateController,
  ),
);

router.post(
  "/",
  upload.array("files"),
  portfolioCertificateController.createPortfolioCertificate.bind(
    portfolioCertificateController,
  ),
);

router.put(
  "/:id",
  upload.array("files"),
  portfolioCertificateController.updatePortfolioCertificate.bind(
    portfolioCertificateController,
  ),
);

router.delete(
  "/:id",
  portfolioCertificateController.deletePortfolioCertificate.bind(
    portfolioCertificateController,
  ),
);

export default router;
