import { Router } from "express";
import LearningActivityCLOMappingController from "../controllers/learning-activity-clo-mapping.controller";

const learningActivityCLOMappingRouter = Router();
const learningActivityCLOMappingController =
  new LearningActivityCLOMappingController();

learningActivityCLOMappingRouter.post(
  "/",
  learningActivityCLOMappingController.createLearningActivityCLOMapping.bind(
    learningActivityCLOMappingController
  )
);

learningActivityCLOMappingRouter.get(
  "/",
  learningActivityCLOMappingController.getLearningActivity.bind(
    learningActivityCLOMappingController
  )
);

export default learningActivityCLOMappingRouter;
