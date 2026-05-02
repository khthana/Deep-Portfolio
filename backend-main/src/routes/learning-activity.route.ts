import { Router } from "express";
import LearningActivityController from "../controllers/learning-activity.controller";
import upload from "../middlewares/upload-minio";
import { verifyTeacher } from "../middlewares/auth.middleware";

const learningActivityRouter = Router();
const learningActivityController = new LearningActivityController();

learningActivityRouter.post(
  "/",
  upload.array("files"),
  verifyTeacher,

  learningActivityController.createLearningActivity.bind(
    learningActivityController,
  ),
);

learningActivityRouter.put(
  "/",
  upload.array("files"),
  verifyTeacher,

  learningActivityController.updateLearningActivity.bind(
    learningActivityController,
  ),
);

learningActivityRouter.delete(
  "/",
  verifyTeacher,

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

learningActivityRouter.get(
  "/submitted/list",
  learningActivityController.getAllSubmittedLearningActivityList.bind(
    learningActivityController,
  ),
);

export default learningActivityRouter;
