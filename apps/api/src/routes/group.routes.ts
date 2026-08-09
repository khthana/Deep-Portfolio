import { Router } from "express";
import GroupController from "../controllers/group.controller";
import { validate } from "../validation/validate";
import {
  acceptInviteBody,
  validateInviteBody,
} from "../validation/group.schema";

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
