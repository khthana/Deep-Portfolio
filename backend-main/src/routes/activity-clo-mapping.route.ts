import { Router } from "express";
import ActivityCLOMappingController from "../controllers/activity-clo-mapping.controller";
import { verifyTeacher } from "../middlewares/auth.middleware";

const activityCLOMappingRouter = Router();
const activityCLOMappingController = new ActivityCLOMappingController();

activityCLOMappingRouter.post(
  "/",
  verifyTeacher,

  activityCLOMappingController.createActivityCLOMapping.bind(
    activityCLOMappingController,
  ),
);

activityCLOMappingRouter.get(
  "/",
  activityCLOMappingController.getActivity.bind(activityCLOMappingController),
);

activityCLOMappingRouter.get(
  "/validate",
  activityCLOMappingController.validateActivityCLOMapping.bind(
    activityCLOMappingController,
  ),
);

export default activityCLOMappingRouter;
