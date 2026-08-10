import { Router } from "express";
import GradebookController from "../controllers/gradebook.controller";
import { requireRole } from "../middlewares/auth.middleware";
import { requireOwnSection } from "../middlewares/owner.middleware";
import { validate } from "../validation/validate";
import { gradebookQuery } from "../validation/gradebook.schema";

const gradebookRouter = Router();
const gradebookController = new GradebookController();

// requireOwnSection after validate, so a request that names no section or a
// malformed one still gets the 400 that says so — see the middleware.
gradebookRouter.get(
  "/per-student",
  requireRole("TEACHER"),
  validate({ query: gradebookQuery }),
  requireOwnSection("query"),
  gradebookController.getGradebookPerStudent.bind(gradebookController),
);

gradebookRouter.get(
  "/per-activity",
  requireRole("TEACHER"),
  validate({ query: gradebookQuery }),
  requireOwnSection("query"),
  gradebookController.getGradebookPerActivity.bind(gradebookController),
);

export default gradebookRouter;
