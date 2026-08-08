import { Router } from "express";
import GradebookController from "../controllers/gradebook.controller";

const gradebookRouter = Router();
const gradebookController = new GradebookController();

gradebookRouter.get(
  "/per-student",
  gradebookController.getGradebookPerStudent.bind(gradebookController),
);

gradebookRouter.get(
  "/per-activity",
  gradebookController.getGradebookPerActivity.bind(gradebookController),
);

export default gradebookRouter;
