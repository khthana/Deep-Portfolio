import { Router } from "express";
import GroupController from "../controllers/group.controller";
import { validate } from "../validation/validate";
import {
  acceptInviteBody,
  validateInviteBody,
} from "../validation/group.schema";

/**
 * The two ends of a group invitation, and one of the two routers in here with
 * no authorisation middleware. That is deliberate and predates the refactor:
 * both are reached from a link in an email, by someone who may not be logged in
 * at the time, so the invite token — 32 random bytes, good for seven days — is
 * the whole of the right. Whoever holds it answers on that student's behalf.
 *
 * Recorded as-is in BEHAVIOR-CHANGES.md rather than changed; a session check
 * here would break the flow the emails already describe. `files.route.ts` is the
 * other router without a guard, for its own reason (ADR-0006). Everything else
 * in this directory has one — see ADR-0014 for the last one that did not.
 */
const groupRouter = Router();
const groupController = new GroupController();

groupRouter.post(
  "/accept-invite",
  validate({ body: acceptInviteBody }),
  groupController.acceptInvite.bind(groupController),
);

groupRouter.post(
  "/validate-invite",
  validate({ body: validateInviteBody }),
  groupController.validateInvite.bind(groupController),
);

export default groupRouter;
