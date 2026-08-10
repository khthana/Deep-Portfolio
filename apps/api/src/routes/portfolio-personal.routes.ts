import { Router } from "express";
import PortfolioPersonalController from "../controllers/portfolio-personal.controller";
import { requireUser } from "../middlewares/auth.middleware";
import { requireSelf } from "../middlewares/owner.middleware";
import upload from "../middlewares/upload-minio";
import {
  portfolioPersonalBody,
  portfolioPersonalParams,
} from "../validation/portfolio-personal.schema";
import { validate } from "../validation/validate";

/**
 * The one section keyed on the student rather than on a row id, so ownership
 * here is `requireSelf("params")` rather than a lookup — the path already says
 * whose row it is, and it has to be the caller's.
 *
 * Order as in portfolio-education.routes.ts: session, then ownership, then
 * `upload`, then `validate`. The create takes no path parameter and no owner at
 * all; it writes the session's row.
 */

const router = Router();
const portfolioPersonalController = new PortfolioPersonalController();

router.get(
  "/:user_id",
  requireUser,
  requireSelf("params"),
  validate({ params: portfolioPersonalParams }),
  portfolioPersonalController.getPortfolioPersonal.bind(
    portfolioPersonalController,
  ),
);

router.post(
  "/",
  requireUser,
  upload.single("file"),
  validate({ body: portfolioPersonalBody }),
  portfolioPersonalController.createPortfolioPersonal.bind(
    portfolioPersonalController,
  ),
);

router.put(
  "/:user_id",
  requireUser,
  requireSelf("params"),
  upload.single("file"),
  validate({ params: portfolioPersonalParams, body: portfolioPersonalBody }),
  portfolioPersonalController.updatePortfolioPersonal.bind(
    portfolioPersonalController,
  ),
);

router.delete(
  "/:user_id",
  requireUser,
  requireSelf("params"),
  validate({ params: portfolioPersonalParams }),
  portfolioPersonalController.deletePortfolioPersonal.bind(
    portfolioPersonalController,
  ),
);

router.post(
  "/:user_id/upsert",
  requireUser,
  requireSelf("params"),
  upload.single("file"),
  validate({ params: portfolioPersonalParams, body: portfolioPersonalBody }),
  portfolioPersonalController.upsertPortfolioPersonal.bind(
    portfolioPersonalController,
  ),
);

export default router;
