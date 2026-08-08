import { Router } from "express";
import CourseController from "../controllers/course.controller";
import UserController from "../controllers/user.controller";
import CourseMaterialController from "../controllers/course-material.controller";
import upload from "../middlewares/upload-minio";
import { requireRole } from "../middlewares/auth.middleware";

const courseMaterialRouter = Router();
const courseMaterialController = new CourseMaterialController();

courseMaterialRouter.get(
  "/",
  courseMaterialController.getCourseMaterial.bind(courseMaterialController),
);

// requireRole before upload, not after: multer runs to completion before the
// next middleware is called, so with the two the other way round a request
// that was about to be refused had already had its files read into memory and
// its handler was one step from putting them in the bucket.
courseMaterialRouter.post(
  "/",
  requireRole("TEACHER"),
  upload.fields([
    { name: "lecture_files", maxCount: 10 },
    { name: "record_files", maxCount: 10 },
  ]),
  courseMaterialController.createCourseMaterial.bind(courseMaterialController),
);

courseMaterialRouter.delete(
  "/",
  requireRole("TEACHER"),

  courseMaterialController.deleteCourseMaterial.bind(courseMaterialController),
);

export default courseMaterialRouter;
