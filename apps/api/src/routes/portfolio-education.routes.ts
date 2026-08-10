import { Router } from "express";
import PortfolioEducationController from "../controllers/portfolio-education.controller";
import { requireUser } from "../middlewares/auth.middleware";
import {
  entryOwner,
  requireOwnEntry,
  requireSelf,
} from "../middlewares/owner.middleware";
import {
  createPortfolioEducationBody,
  updatePortfolioEducationBody,
} from "../validation/portfolio-sections.schema";
import {
  portfolioEntryParams,
  portfolioOwnerQuery,
} from "../validation/portfolio.schema";
import { validate } from "../validation/validate";

/**
 * The order every route in the portfolio group uses (#31).
 *
 * `requireUser` first: nothing else is worth doing for a request with no
 * session. Then the ownership check, which needs only the session and the path,
 * so a request for somebody else's row is refused before its body is read.
 *
 * `requireSelf` is the exception and runs after `validate`, because it compares
 * a field the schema declares — a request that names no user at all is a
 * malformed one, and saying 400 is more use to the caller than 403.
 */

const router = Router();
const portfolioEducationController = new PortfolioEducationController();

router.get(
  "/",
  requireUser,
  validate({ query: portfolioOwnerQuery }),
  requireSelf("query"),
  portfolioEducationController.getAllPortfolioEducation.bind(
    portfolioEducationController,
  ),
);

router.get(
  "/:id",
  requireUser,
  requireOwnEntry(entryOwner.education),
  validate({ params: portfolioEntryParams }),
  portfolioEducationController.getPortfolioEducationById.bind(
    portfolioEducationController,
  ),
);

router.post(
  "/",
  requireUser,
  validate({ body: createPortfolioEducationBody }),
  portfolioEducationController.createPortfolioEducation.bind(
    portfolioEducationController,
  ),
);

router.put(
  "/:id",
  requireUser,
  requireOwnEntry(entryOwner.education),
  validate({ params: portfolioEntryParams, body: updatePortfolioEducationBody }),
  portfolioEducationController.updatePortfolioEducation.bind(
    portfolioEducationController,
  ),
);

router.delete(
  "/:id",
  requireUser,
  requireOwnEntry(entryOwner.education),
  validate({ params: portfolioEntryParams }),
  portfolioEducationController.deletePortfolioEducation.bind(
    portfolioEducationController,
  ),
);

export default router;
