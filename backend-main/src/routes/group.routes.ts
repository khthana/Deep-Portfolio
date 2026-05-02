import { Router } from "express";
import GroupController from "../controllers/group.controller";
import { verifyAnyRole } from "../middlewares/auth.middleware";

const groupRouter = Router();
const groupController = new GroupController();

// router.post(
//   "/:groupId/invite",
//   verifyAnyRole,
//   groupController.inviteMember.bind(groupController),
// );

groupRouter.post(
  "/accept-invite",
  groupController.acceptInvite.bind(groupController),
);

groupRouter.post(
  "/validate-invite",
  groupController.validateInvite.bind(groupController),
);

export default groupRouter;
