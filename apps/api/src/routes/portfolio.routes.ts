import { Router } from "express";
import PortfolioController from "../controllers/portfolio.controller";
import { requireUser } from "../middlewares/auth.middleware";
import {
  entryOwner,
  requireOwnEntry,
  requireSelf,
} from "../middlewares/owner.middleware";
import {
  createPortfolioBody,
  generateShareLinkBody,
  portfolioOwnerQuery,
  portfolioParams,
  shareTokenParams,
  updatePortfolioBody,
} from "../validation/portfolio.schema";
import { validate } from "../validation/validate";

/**
 * Order as in portfolio-education.routes.ts, and one exception to it.
 *
 * `GET /public/:token` is the only route in the whole group with no session
 * behind it. The token is the credential — that is what the share button is
 * for — and asking the reader to sign in first would leave the feature with
 * nothing to do (ADR-0001). It stays registered above `/:id` so a token is
 * never read as a portfolio id.
 *
 * `GET /templates` is behind `requireUser` but nothing more: the templates are
 * the same nine for everybody and belong to no one.
 */

const router = Router();
const portfolioController = new PortfolioController();

router.get(
  "/",
  requireUser,
  validate({ query: portfolioOwnerQuery }),
  requireSelf("query"),
  portfolioController.getAllPortfolios.bind(portfolioController),
);
router.get(
  "/templates",
  requireUser,
  portfolioController.getAllTemplates.bind(portfolioController),
);

router.get(
  "/public/:token",
  validate({ params: shareTokenParams }),
  portfolioController.getPublicPortfolioById.bind(portfolioController),
);

router.post(
  "/:id/generate-share-link",
  requireUser,
  requireOwnEntry(entryOwner.portfolio),
  validate({ params: portfolioParams, body: generateShareLinkBody }),
  portfolioController.generateShareLink.bind(portfolioController),
);

router.get(
  "/:id",
  requireUser,
  requireOwnEntry(entryOwner.portfolio),
  validate({ params: portfolioParams }),
  portfolioController.getPortfolioById.bind(portfolioController),
);

router.post(
  "/",
  requireUser,
  validate({ body: createPortfolioBody }),
  portfolioController.createPortfolio.bind(portfolioController),
);

router.put(
  "/:id",
  requireUser,
  requireOwnEntry(entryOwner.portfolio),
  validate({ params: portfolioParams, body: updatePortfolioBody }),
  portfolioController.updatePortfolio.bind(portfolioController),
);

router.patch(
  "/:id",
  requireUser,
  requireOwnEntry(entryOwner.portfolio),
  validate({ params: portfolioParams, body: updatePortfolioBody }),
  portfolioController.updatePortfolio.bind(portfolioController),
);

router.delete(
  "/:id",
  requireUser,
  requireOwnEntry(entryOwner.portfolio),
  validate({ params: portfolioParams }),
  portfolioController.deletePortfolio.bind(portfolioController),
);

export default router;
