import { Router } from "express";
import CourseController from "../controllers/course.controller";
import UserController from "../controllers/user.controller";
import CourseMaterialController from "../controllers/course-material.controller";
import upload from "../middlewares/upload-minio";
import { verifyTeacher } from "../middlewares/auth.middleware";

const courseMaterialRouter = Router();
const courseMaterialController = new CourseMaterialController();

courseMaterialRouter.get(
  "/",
  courseMaterialController.getCourseMaterial.bind(courseMaterialController),
);

courseMaterialRouter.post(
  "/",
  upload.fields([
    { name: "lecture_files", maxCount: 10 },
    { name: "record_files", maxCount: 10 },
  ]),
  verifyTeacher,

  courseMaterialController.createCourseMaterial.bind(courseMaterialController),
);

courseMaterialRouter.delete(
  "/",
  verifyTeacher,

  courseMaterialController.deleteCourseMaterial.bind(courseMaterialController),
);

export default courseMaterialRouter;
