import { Router } from "express";
import GroupController from "../controllers/group.controller";

const groupRouter = Router();
const groupController = new GroupController();

groupRouter.post(
  "/accept-invite",
  groupController.acceptInvite.bind(groupController),
);

groupRouter.post(
  "/validate-invite",
  groupController.validateInvite.bind(groupController),
);

export default groupRouter;
