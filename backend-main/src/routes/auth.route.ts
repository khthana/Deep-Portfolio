import { Router } from "express";
import AuthController from "../controllers/auth.controller";
import { verifyAnyRole } from "../middlewares/auth.middleware";

const authRouter = Router();
const authController = new AuthController();

authRouter.get("/", verifyAnyRole, authController.getUser.bind(authController));
authRouter.get("/login", authController.ssoLogin.bind(authController));
authRouter.post("/logout", authController.logout.bind(authController));
authRouter.post("/refresh", authController.refresh.bind(authController));

export default authRouter;
