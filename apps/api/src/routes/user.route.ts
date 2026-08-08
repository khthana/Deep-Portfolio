import { Router } from "express";
import CourseController from "../controllers/course.controller";
import UserController from "../controllers/user.controller";
import { requireRole } from "../middlewares/auth.middleware";

const userRouter = Router();
const userController = new UserController();

userRouter.get("/", userController.getUser.bind(userController));

userRouter.get(
  "/student",
  requireRole("STUDENT"),
  userController.getStudentDetail.bind(userController),
);

export default userRouter;
