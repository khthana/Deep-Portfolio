import { Router } from "express";
import CourseController from "../controllers/course.controller";
import ScoreWeightController from "../controllers/score-weight.controller";
import { requireRole } from "../middlewares/auth.middleware";

const scoreWeightRouter = Router();
const scoreWeightController = new ScoreWeightController();

scoreWeightRouter.get(
  "/",
  scoreWeightController.getScoreWeight.bind(scoreWeightController),
);

scoreWeightRouter.post(
  "/",
  requireRole("TEACHER"),
  scoreWeightController.addScoreWeight.bind(scoreWeightController),
);

scoreWeightRouter.put(
  "/",
  requireRole("TEACHER"),
  scoreWeightController.updateScoreWeight.bind(scoreWeightController),
);

scoreWeightRouter.delete(
  "/",
  requireRole("TEACHER"),
  scoreWeightController.deleteScoreWeight.bind(scoreWeightController),
);

//-------------------------------------

scoreWeightRouter.get(
  "/options",
  scoreWeightController.getScoreWeightOptions.bind(scoreWeightController),
);

export default scoreWeightRouter;
