import { Router } from "express";
import AuthController from "../controllers/auth.controller";
import { requireUser } from "../middlewares/auth.middleware";

const authRouter = Router();
const authController = new AuthController();

authRouter.get("/", requireUser, authController.getUser.bind(authController));
// POST, not GET: this carries a credential in the body and mints a session.
authRouter.post("/google", authController.googleLogin.bind(authController));
authRouter.post("/logout", authController.logout.bind(authController));
authRouter.post("/refresh", authController.refresh.bind(authController));

export default authRouter;
