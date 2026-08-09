import { Router } from "express";
import CourseMaterialController from "../controllers/course-material.controller";
import upload from "../middlewares/upload-minio";
import { requireRole } from "../middlewares/auth.middleware";
import { validate } from "../validation/validate";
import {
  courseMaterialQuery,
  createCourseMaterialBody,
  deleteCourseMaterialQuery,
} from "../validation/course-material.schema";

const courseMaterialRouter = Router();
const courseMaterialController = new CourseMaterialController();

courseMaterialRouter.get(
  "/",
  validate({ query: courseMaterialQuery }),
  courseMaterialController.getCourseMaterial.bind(courseMaterialController),
);

// requireRole before upload, not after: multer runs to completion before the
// next middleware is called, so with the two the other way round a request
// that was about to be refused had already had its files read into memory and
// its handler was one step from putting them in the bucket.
//
// validate after upload, for the opposite reason: the body of a multipart
// request does not exist until multer has parsed it.
courseMaterialRouter.post(
  "/",
  requireRole("TEACHER"),
  upload.fields([
    { name: "lecture_files", maxCount: 10 },
    { name: "record_files", maxCount: 10 },
  ]),
  validate({ body: createCourseMaterialBody }),
  courseMaterialController.createCourseMaterial.bind(courseMaterialController),
);

courseMaterialRouter.delete(
  "/",
  requireRole("TEACHER"),
  validate({ query: deleteCourseMaterialQuery }),
  courseMaterialController.deleteCourseMaterial.bind(courseMaterialController),
);

export default courseMaterialRouter;
