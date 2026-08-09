import { Router } from "express";
import RubricController from "../controllers/rubric.controller";
import { validate } from "../validation/validate";
import {
  sharedRubricDetailQuery,
  sharedRubricQuery,
} from "../validation/rubric.schema";

const rubricRouter = Router();
const rubricController = new RubricController();

rubricRouter.get(
  "/shared-rubric",
  validate({ query: sharedRubricQuery }),
  rubricController.getSharedRubric.bind(rubricController),
);

rubricRouter.get(
  "/shared-rubric/detail",
  validate({ query: sharedRubricDetailQuery }),
  rubricController.getSharedRubricDetail.bind(rubricController),
);

export default rubricRouter;
