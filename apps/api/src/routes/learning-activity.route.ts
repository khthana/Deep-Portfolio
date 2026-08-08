import { Router } from "express";
import LearningActivityController from "../controllers/learning-activity.controller";
import upload from "../middlewares/upload-minio";
import { requireRole } from "../middlewares/auth.middleware";

const learningActivityRouter = Router();
const learningActivityController = new LearningActivityController();

// requireRole before upload, not after — see the note in activity.route.ts.
learningActivityRouter.post(
  "/",
  requireRole("TEACHER"),
  upload.array("files"),

  learningActivityController.createLearningActivity.bind(
    learningActivityController,
  ),
);

learningActivityRouter.put(
  "/",
  requireRole("TEACHER"),
  upload.array("files"),

  learningActivityController.updateLearningActivity.bind(
    learningActivityController,
  ),
);

learningActivityRouter.delete(
  "/",
  requireRole("TEACHER"),

  learningActivityController.deleteLearningActivity.bind(
    learningActivityController,
  ),
);

learningActivityRouter.get(
  "/",
  learningActivityController.getLearningActivityDetail.bind(
    learningActivityController,
  ),
);

learningActivityRouter.get(
  "/list",
  learningActivityController.getAllLearningActivity.bind(
    learningActivityController,
  ),
);

learningActivityRouter.get(
  "/student/detail",
  learningActivityController.getStudentLearningActivityDetail.bind(
    learningActivityController,
  ),
);

learningActivityRouter.get(
  "/options",
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

  learningActivityController.getAllSubmittedLearningActivityList.bind(
    learningActivityController,
  ),
);

export default learningActivityRouter;
