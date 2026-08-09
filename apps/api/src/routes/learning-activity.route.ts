import { Router } from "express";
import LearningActivityController from "../controllers/learning-activity.controller";
import upload from "../middlewares/upload-minio";
import { requireRole } from "../middlewares/auth.middleware";
import { validate } from "../validation/validate";
import {
  createLearningActivityBody,
  learningActivityListQuery,
  learningActivityQuery,
  studentLearningActivityDetailQuery,
  updateLearningActivityBody,
} from "../validation/learning-activity.schema";

const learningActivityRouter = Router();
const learningActivityController = new LearningActivityController();

// requireRole before upload, validate after it — see the note in
// activity.route.ts.
learningActivityRouter.post(
  "/",
  requireRole("TEACHER"),
  upload.array("files"),
  validate({ body: createLearningActivityBody }),
  learningActivityController.createLearningActivity.bind(
    learningActivityController,
  ),
);

learningActivityRouter.put(
  "/",
  requireRole("TEACHER"),
  upload.array("files"),
  validate({ body: updateLearningActivityBody }),
  learningActivityController.updateLearningActivity.bind(
    learningActivityController,
  ),
);

learningActivityRouter.delete(
  "/",
  requireRole("TEACHER"),
  validate({ query: learningActivityQuery }),
  learningActivityController.deleteLearningActivity.bind(
    learningActivityController,
  ),
);

learningActivityRouter.get(
  "/",
  validate({ query: learningActivityQuery }),
  learningActivityController.getLearningActivityDetail.bind(
    learningActivityController,
  ),
);

learningActivityRouter.get(
  "/list",
  validate({ query: learningActivityListQuery }),
  learningActivityController.getAllLearningActivity.bind(
    learningActivityController,
  ),
);

learningActivityRouter.get(
  "/student/detail",
  validate({ query: studentLearningActivityDetailQuery }),
  learningActivityController.getStudentLearningActivityDetail.bind(
    learningActivityController,
  ),
);

learningActivityRouter.get(
  "/options",
  validate({ query: learningActivityListQuery }),
  learningActivityController.getLearningActivityOptions.bind(
    learningActivityController,
  ),
);

// The class roster with every student's submission state on it. The activity
// half of the same screen (GET /activity/submitted/list) is a teacher's; this
// one was reachable by anyone at all.
learningActivityRouter.get(
  "/submitted/list",
  requireRole("TEACHER"),
  validate({ query: learningActivityQuery }),
  learningActivityController.getAllSubmittedLearningActivityList.bind(
    learningActivityController,
  ),
);

export default learningActivityRouter;
