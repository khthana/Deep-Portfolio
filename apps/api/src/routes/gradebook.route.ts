import { Router } from "express";
import GradebookController from "../controllers/gradebook.controller";
import { requireRole } from "../middlewares/auth.middleware";

const gradebookRouter = Router();
const gradebookController = new GradebookController();

gradebookRouter.get(
  "/per-student",
  requireRole("TEACHER"),
  gradebookController.getGradebookPerStudent.bind(gradebookController),
);

gradebookRouter.get(
  "/per-activity",
  requireRole("TEACHER"),
  gradebookController.getGradebookPerActivity.bind(gradebookController),
);

export default gradebookRouter;
