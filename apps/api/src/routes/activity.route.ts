import { Router } from "express";
import ActivityController from "../controllers/activity.controller";
import upload from "../middlewares/upload-minio";
import { requireRole } from "../middlewares/auth.middleware";

const activityRouter = Router();
const activityController = new ActivityController();

activityRouter.post(
  "/",
  upload.array("files"),
  requireRole("TEACHER"),

  activityController.createActivity.bind(activityController),
);

activityRouter.put(
  "/",
  upload.array("files"),
  requireRole("TEACHER"),

  activityController.updateActivity.bind(activityController),
);

activityRouter.delete(
  "/",
  requireRole("TEACHER"),

  activityController.deleteActivity.bind(activityController),
);

activityRouter.get(
  "/",
  activityController.getActivityDetail.bind(activityController),
);

activityRouter.get(
  "/list",
  activityController.getAllActivity.bind(activityController),
);

activityRouter.get(
  "/student/detail",
  activityController.getStudentActivityDetail.bind(activityController),
);

activityRouter.get(
  "/options",
  activityController.getActivityOptions.bind(activityController),
);

activityRouter.get(
  "/submitted/list",
  requireRole("TEACHER"),

  activityController.getAllSubmittedActivityList.bind(activityController),
);

export default activityRouter;
