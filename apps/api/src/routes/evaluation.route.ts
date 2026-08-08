import { Router } from "express";
import CourseController from "../controllers/course.controller";
import UserController from "../controllers/user.controller";
import EvaluationController from "../controllers/evalution.controller";
import { requireRole } from "../middlewares/auth.middleware";

const evaluationRouter = Router();
const evaluationController = new EvaluationController();

evaluationRouter.get(
  "/list",
  requireRole("STUDENT"),
  evaluationController.getStudentEvaluationList.bind(evaluationController),
);

export default evaluationRouter;
