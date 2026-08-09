import { Router } from "express";
import ActivityCLOMappingController from "../controllers/activity-clo-mapping.controller";
import { requireRole } from "../middlewares/auth.middleware";
import { validate } from "../validation/validate";
import {
  cloMappingQuery,
  createActivityCLOMappingBody,
  validateActivityCLOMappingQuery,
} from "../validation/clo-mapping.schema";

const activityCLOMappingRouter = Router();
const activityCLOMappingController = new ActivityCLOMappingController();

activityCLOMappingRouter.post(
  "/",
  requireRole("TEACHER"),
  validate({ body: createActivityCLOMappingBody }),
  activityCLOMappingController.createActivityCLOMapping.bind(
    activityCLOMappingController,
  ),
);

activityCLOMappingRouter.get(
  "/",
  validate({ query: cloMappingQuery }),
  activityCLOMappingController.getActivity.bind(activityCLOMappingController),
);

activityCLOMappingRouter.get(
  "/validate",
  validate({ query: validateActivityCLOMappingQuery }),
  activityCLOMappingController.validateActivityCLOMapping.bind(
    activityCLOMappingController,
  ),
);

export default activityCLOMappingRouter;
