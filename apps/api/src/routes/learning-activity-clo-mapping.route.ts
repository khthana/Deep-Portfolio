import { Router } from "express";
import LearningActivityCLOMappingController from "../controllers/learning-activity-clo-mapping.controller";
import { requireRole } from "../middlewares/auth.middleware";

const learningActivityCLOMappingRouter = Router();
const learningActivityCLOMappingController =
  new LearningActivityCLOMappingController();

// The activity half of the same screen (POST /mapping/activity) is a
// teacher's; this one had no middleware on it at all.
learningActivityCLOMappingRouter.post(
  "/",
  requireRole("TEACHER"),

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
