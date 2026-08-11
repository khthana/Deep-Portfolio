import { Router } from "express";
import UserController from "../controllers/user.controller";
import { requireRole, requireUser } from "../middlewares/auth.middleware";
import { requireSelf } from "../middlewares/owner.middleware";
import { validate } from "../validation/validate";
import { userQuery } from "../validation/identity.schema";

const userRouter = Router();
const userController = new UserController();

// requireUser, not requireRole: a `users` row is what everybody signed in has
// one of, and reading your own is nobody's privilege in particular. The id
// stays in the query and requireSelf refuses anyone else's (#40) — before that
// this route had no middleware at all, and a guessed eight-character id was a
// name, an email address and a phone number.
userRouter.get(
  "/",
  requireUser,
  validate({ query: userQuery }),
  requireSelf("query", "id"),
  userController.getUser.bind(userController),
);

userRouter.get(
  "/student",
  requireRole("STUDENT"),
  userController.getStudentDetail.bind(userController),
);

export default userRouter;
