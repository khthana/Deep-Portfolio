import { Router } from "express";
import RubricController from "../controllers/rubric.controller";

const rubricRouter = Router();
const rubricController = new RubricController();

rubricRouter.get(
  "/shared-rubric",
  rubricController.getSharedRubric.bind(rubricController)
);

rubricRouter.get(
  "/shared-rubric/detail",
  rubricController.getSharedRubricDetail.bind(rubricController)
);

export default rubricRouter;
