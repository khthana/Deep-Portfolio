import { Router } from "express";
import PortfolioSkillController from "../controllers/portfolio-skill.controller";
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

const router = Router();
const portfolioSkillController = new PortfolioSkillController();

router.get(
  "/",
  validate({ query: portfolioOwnerQuery }),
  portfolioSkillController.getAllPortfolioSkill.bind(portfolioSkillController),
);

router.get(
  "/works",
  validate({ query: portfolioOwnerQuery }),
  portfolioSkillController.getPortfolioWorks.bind(portfolioSkillController),
);

router.get(
  "/:id",
  validate({ params: portfolioEntryParams }),
  portfolioSkillController.getPortfolioSkillById.bind(portfolioSkillController),
);

router.post(
  "/",
  validate({ body: createPortfolioSkillBody }),
  portfolioSkillController.createPortfolioSkill.bind(portfolioSkillController),
);

router.put(
  "/:id",
  validate({ params: portfolioEntryParams, body: updatePortfolioSkillBody }),
  portfolioSkillController.updatePortfolioSkill.bind(portfolioSkillController),
);

router.delete(
  "/:id",
  validate({ params: portfolioEntryParams }),
  portfolioSkillController.deletePortfolioSkill.bind(portfolioSkillController),
);

router.get(
  "/mapping/:id",
  validate({ params: portfolioEntryParams }),
  portfolioSkillController.getPortfolioSkillMappingById.bind(
    portfolioSkillController,
  ),
);

router.post(
  "/assign-work",
  validate({ body: assignWorkToSkillsBody }),
  portfolioSkillController.assignWorkToSkills.bind(portfolioSkillController),
);

router.delete(
  "/mapping/:id",
  validate({ params: portfolioEntryParams }),
  portfolioSkillController.deleteSkillMapping.bind(portfolioSkillController),
);

export default router;
