import { Router } from "express";
import CourseController from "../controllers/course.controller";
import ScoreWeightController from "../controllers/score-weight.controller";
import { verifyTeacher } from "../middlewares/auth.middleware";

const scoreWeightRouter = Router();
const scoreWeightController = new ScoreWeightController();

scoreWeightRouter.get(
  "/",
  scoreWeightController.getScoreWeight.bind(scoreWeightController),
);

scoreWeightRouter.post(
  "/",
  verifyTeacher,
  scoreWeightController.addScoreWeight.bind(scoreWeightController),
);

scoreWeightRouter.put(
  "/",
  verifyTeacher,
  scoreWeightController.updateScoreWeight.bind(scoreWeightController),
);

scoreWeightRouter.delete(
  "/",
  verifyTeacher,
  scoreWeightController.deleteScoreWeight.bind(scoreWeightController),
);

//-------------------------------------

scoreWeightRouter.get(
  "/options",
  scoreWeightController.getScoreWeightOptions.bind(scoreWeightController),
);

export default scoreWeightRouter;
