import express from "express";
import cookieParser from "cookie-parser";
import cors from "cors";
import router from "./routes";
import { errorHandler } from "./middlewares/error.middleware";
import { env } from "./config/env";

/**
 * The Express application, fully wired but not listening.
 *
 * Importing this module must stay free of side effects that reach outside the
 * process — no open port, no scheduled job. That is what lets a test import
 * the app and drive it over the HTTP boundary. Starting the server lives in
 * server.ts. See D4 in docs/spec-refactor-redeploy.md.
 */
export const app = express();

app.use(cookieParser());

app.use(
  cors({
    origin: env.CLIENT_URL,
    credentials: true,
  }),
);

app.use(express.json());
app.use(express.urlencoded({ extended: true }));

app.use(router);
app.use(errorHandler);

export default app;
