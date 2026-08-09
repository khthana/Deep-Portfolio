import { Router } from "express";
import EvaluationController from "../controllers/evalution.controller";
import { requireRole } from "../middlewares/auth.middleware";
import { validate } from "../validation/validate";
import { evaluationListQuery } from "../validation/evaluation.schema";

const evaluationRouter = Router();
const evaluationController = new EvaluationController();

evaluationRouter.get(
  "/list",
  requireRole("STUDENT"),
  validate({ query: evaluationListQuery }),
  evaluationController.getStudentEvaluationList.bind(evaluationController),
);

export default evaluationRouter;
