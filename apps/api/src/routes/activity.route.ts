import { Router } from "express";
import ActivityController from "../controllers/activity.controller";
import upload from "../middlewares/upload-minio";
import { requireRole } from "../middlewares/auth.middleware";
import { validate } from "../validation/validate";
import {
  activityListQuery,
  activityQuery,
  createActivityBody,
  studentActivityDetailQuery,
  updateActivityBody,
} from "../validation/activity.schema";

const activityRouter = Router();
const activityController = new ActivityController();

// requireRole before upload, not after: multer runs to completion before the
// next middleware is called, so with the two the other way round a request
// that was about to be refused had already had its files read into memory.
//
// validate after upload, for the opposite reason: the body of a multipart
// request does not exist until multer has parsed it.
activityRouter.post(
  "/",
  requireRole("TEACHER"),
  upload.array("files"),
  validate({ body: createActivityBody }),
  activityController.createActivity.bind(activityController),
);

activityRouter.put(
  "/",
  requireRole("TEACHER"),
  upload.array("files"),
  validate({ body: updateActivityBody }),
  activityController.updateActivity.bind(activityController),
);

activityRouter.delete(
  "/",
  requireRole("TEACHER"),
  validate({ query: activityQuery }),
  activityController.deleteActivity.bind(activityController),
);

activityRouter.get(
  "/",
  validate({ query: activityQuery }),
  activityController.getActivityDetail.bind(activityController),
);

activityRouter.get(
  "/list",
  validate({ query: activityListQuery }),
  activityController.getAllActivity.bind(activityController),
);

activityRouter.get(
  "/student/detail",
  validate({ query: studentActivityDetailQuery }),
  activityController.getStudentActivityDetail.bind(activityController),
);

activityRouter.get(
  "/options",
  validate({ query: activityListQuery }),
  activityController.getActivityOptions.bind(activityController),
);

activityRouter.get(
  "/submitted/list",
  requireRole("TEACHER"),
  validate({ query: activityQuery }),
  activityController.getAllSubmittedActivityList.bind(activityController),
);

export default activityRouter;
