import { Router } from "express";
import UserController from "../controllers/user.controller";
import { requireRole } from "../middlewares/auth.middleware";
import { validate } from "../validation/validate";
import { userQuery } from "../validation/identity.schema";

const userRouter = Router();
const userController = new UserController();

userRouter.get(
  "/",
  validate({ query: userQuery }),
  userController.getUser.bind(userController),
);

userRouter.get(
  "/student",
  requireRole("STUDENT"),
  userController.getStudentDetail.bind(userController),
);

export default userRouter;
