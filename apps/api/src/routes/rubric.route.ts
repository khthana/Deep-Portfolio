import { Router } from "express";
import RubricController from "../controllers/rubric.controller";
import { requireRole } from "../middlewares/auth.middleware";
import { validate } from "../validation/validate";
import {
  sharedRubricDetailQuery,
  sharedRubricQuery,
} from "../validation/rubric.schema";

/**
 * The programme's shared rubrics — read-only reference data a teacher copies
 * from when writing an activity's own rubric.
 *
 * Both are the teacher's, and no narrower than that (#49, ADR-0014). There is
 * no `requireOwnSection` here because a rubric belongs to a programme rather
 * than to a section, and no programme check because `users.program_id` is a
 * column the importer does not insist on — a rule standing on it would refuse
 * teachers who are entitled.
 */
const rubricRouter = Router();
const rubricController = new RubricController();

rubricRouter.get(
  "/shared-rubric",
  requireRole("TEACHER"),
  validate({ query: sharedRubricQuery }),
  rubricController.getSharedRubric.bind(rubricController),
);

rubricRouter.get(
  "/shared-rubric/detail",
  requireRole("TEACHER"),
  validate({ query: sharedRubricDetailQuery }),
  rubricController.getSharedRubricDetail.bind(rubricController),
);

export default rubricRouter;
