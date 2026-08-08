import { Router } from "express";
import ActivityCLOMappingController from "../controllers/activity-clo-mapping.controller";
import { requireRole } from "../middlewares/auth.middleware";

const activityCLOMappingRouter = Router();
const activityCLOMappingController = new ActivityCLOMappingController();

activityCLOMappingRouter.post(
  "/",
  requireRole("TEACHER"),

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
