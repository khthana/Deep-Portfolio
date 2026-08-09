import { Router } from "express";
import GradebookController from "../controllers/gradebook.controller";
import { requireRole } from "../middlewares/auth.middleware";
import { validate } from "../validation/validate";
import { gradebookQuery } from "../validation/gradebook.schema";

const gradebookRouter = Router();
const gradebookController = new GradebookController();

gradebookRouter.get(
  "/per-student",
  requireRole("TEACHER"),
  validate({ query: gradebookQuery }),
  gradebookController.getGradebookPerStudent.bind(gradebookController),
);

gradebookRouter.get(
  "/per-activity",
  requireRole("TEACHER"),
  validate({ query: gradebookQuery }),
  gradebookController.getGradebookPerActivity.bind(gradebookController),
);

export default gradebookRouter;
