import { Router } from "express";
import PortfolioSkillController from "../controllers/portfolio-skill.controller";

const router = Router();
const portfolioSkillController = new PortfolioSkillController();

router.get(
  "/",
  portfolioSkillController.getAllPortfolioSkill.bind(portfolioSkillController),
);

router.get(
  "/works",
  portfolioSkillController.getPortfolioWorks.bind(portfolioSkillController),
);

router.get(
  "/:id",
  portfolioSkillController.getPortfolioSkillById.bind(portfolioSkillController),
);

router.post(
  "/",
  portfolioSkillController.createPortfolioSkill.bind(portfolioSkillController),
);

router.put(
  "/:id",
  portfolioSkillController.updatePortfolioSkill.bind(portfolioSkillController),
);

router.delete(
  "/:id",
  portfolioSkillController.deletePortfolioSkill.bind(portfolioSkillController),
);

router.get(
  "/mapping/:id",
  portfolioSkillController.getPortfolioSkillMappingById.bind(
    portfolioSkillController,
  ),
);

router.post(
  "/assign-work",
  portfolioSkillController.assignWorkToSkills.bind(portfolioSkillController),
);

router.delete(
  "/mapping/:id",
  portfolioSkillController.deleteSkillMapping.bind(portfolioSkillController),
);

export default router;
