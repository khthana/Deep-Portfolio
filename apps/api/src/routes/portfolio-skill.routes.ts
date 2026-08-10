import { Router } from "express";
import PortfolioSkillController from "../controllers/portfolio-skill.controller";
import { requireUser } from "../middlewares/auth.middleware";
import {
  entryOwner,
  requireOwnEntry,
  requireSelf,
} from "../middlewares/owner.middleware";
import {
  assignWorkToSkillsBody,
  createPortfolioSkillBody,
  updatePortfolioSkillBody,
} from "../validation/portfolio-skill.schema";
import {
  portfolioEntryParams,
  portfolioOwnerQuery,
} from "../validation/portfolio.schema";
import { validate } from "../validation/validate";

/**
 * Order as in portfolio-education.routes.ts. Two kinds of row here rather than
 * one: a skill owns itself, and a mapping is owned by the skill it hangs off —
 * `entryOwner.skillMapping` reads the owner through that relation.
 *
 * `POST /assign-work` names skills in the body instead of a row in the path, so
 * its check is not one of these: the service refuses the whole transaction with
 * a 403 unless every skill in the list belongs to the caller.
 */

const router = Router();
const portfolioSkillController = new PortfolioSkillController();

router.get(
  "/",
  requireUser,
  validate({ query: portfolioOwnerQuery }),
  requireSelf("query"),
  portfolioSkillController.getAllPortfolioSkill.bind(portfolioSkillController),
);

router.get(
  "/works",
  requireUser,
  validate({ query: portfolioOwnerQuery }),
  requireSelf("query"),
  portfolioSkillController.getPortfolioWorks.bind(portfolioSkillController),
);

router.get(
  "/:id",
  requireUser,
  requireOwnEntry(entryOwner.skill),
  validate({ params: portfolioEntryParams }),
  portfolioSkillController.getPortfolioSkillById.bind(portfolioSkillController),
);

router.post(
  "/",
  requireUser,
  validate({ body: createPortfolioSkillBody }),
  portfolioSkillController.createPortfolioSkill.bind(portfolioSkillController),
);

router.put(
  "/:id",
  requireUser,
  requireOwnEntry(entryOwner.skill),
  validate({ params: portfolioEntryParams, body: updatePortfolioSkillBody }),
  portfolioSkillController.updatePortfolioSkill.bind(portfolioSkillController),
);

router.delete(
  "/:id",
  requireUser,
  requireOwnEntry(entryOwner.skill),
  validate({ params: portfolioEntryParams }),
  portfolioSkillController.deletePortfolioSkill.bind(portfolioSkillController),
);

router.get(
  "/mapping/:id",
  requireUser,
  requireOwnEntry(entryOwner.skillMapping),
  validate({ params: portfolioEntryParams }),
  portfolioSkillController.getPortfolioSkillMappingById.bind(
    portfolioSkillController,
  ),
);

router.post(
  "/assign-work",
  requireUser,
  validate({ body: assignWorkToSkillsBody }),
  portfolioSkillController.assignWorkToSkills.bind(portfolioSkillController),
);

router.delete(
  "/mapping/:id",
  requireUser,
  requireOwnEntry(entryOwner.skillMapping),
  validate({ params: portfolioEntryParams }),
  portfolioSkillController.deleteSkillMapping.bind(portfolioSkillController),
);

export default router;
