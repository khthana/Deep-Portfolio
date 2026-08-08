import { Router } from "express";
import ActivityController from "../controllers/activity.controller";
import upload from "../middlewares/upload-minio";
import { requireRole } from "../middlewares/auth.middleware";

const activityRouter = Router();
const activityController = new ActivityController();

// requireRole before upload, not after: multer runs to completion before the
// next middleware is called, so with the two the other way round a request
// that was about to be refused had already had its files read into memory.
activityRouter.post(
  "/",
  requireRole("TEACHER"),
  upload.array("files"),

  activityController.createActivity.bind(activityController),
);

activityRouter.put(
  "/",
  requireRole("TEACHER"),
  upload.array("files"),

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
