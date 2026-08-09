import { Router } from "express";
import ScoreWeightController from "../controllers/score-weight.controller";
import { requireRole } from "../middlewares/auth.middleware";
import { validate } from "../validation/validate";
import {
  addScoreWeightBody,
  deleteScoreWeightQuery,
  scoreWeightQuery,
  updateScoreWeightBody,
} from "../validation/score-weight.schema";

const scoreWeightRouter = Router();
const scoreWeightController = new ScoreWeightController();

scoreWeightRouter.get(
  "/",
  validate({ query: scoreWeightQuery }),
  scoreWeightController.getScoreWeight.bind(scoreWeightController),
);

scoreWeightRouter.post(
  "/",
  requireRole("TEACHER"),
  validate({ body: addScoreWeightBody }),
  scoreWeightController.addScoreWeight.bind(scoreWeightController),
);

scoreWeightRouter.put(
  "/",
  requireRole("TEACHER"),
  validate({ body: updateScoreWeightBody }),
  scoreWeightController.updateScoreWeight.bind(scoreWeightController),
);

scoreWeightRouter.delete(
  "/",
  requireRole("TEACHER"),
  validate({ query: deleteScoreWeightQuery }),
  scoreWeightController.deleteScoreWeight.bind(scoreWeightController),
);

//-------------------------------------

scoreWeightRouter.get(
  "/options",
  validate({ query: scoreWeightQuery }),
  scoreWeightController.getScoreWeightOptions.bind(scoreWeightController),
);

export default scoreWeightRouter;
