import { Router } from "express";
import CourseController from "../controllers/course.controller";
import UserController from "../controllers/user.controller";
import { verifyStudent } from "../middlewares/auth.middleware";

const userRouter = Router();
const userController = new UserController();

userRouter.get("/", userController.getUser.bind(userController));

userRouter.get(
  "/student",
  verifyStudent,
  userController.getStudentDetail.bind(userController),
);

export default userRouter;
