import express, { type Request, type Response } from "express";
import router from "./routes";
import cors from "cors";
import { errorHandler } from "./middlewares/error.middleware";
import path from "path";
import cookieParser from "cookie-parser";
import { BUCKET_NAME, minioClient } from "./config/minio";
import { setupAssignTasksCron } from "./jobs/assign-tasks.job";

const port = process.env.PORT || 4001;

const app = express();

app.use(cookieParser());

app.use(
  cors({
    origin: process.env.CLIENT_URL || "http://localhost:3000",
    credentials: true,
  }),
);

app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.get("/uploads/:filename", (req, res) => {
  const { filename } = req.params;

  const filePath = path.resolve("uploads", filename);

  const originalName = (req.query.title as string) || filename;

  res.download(filePath, originalName);
});

app.use("/uploads", express.static("uploads"));

app.get("/files", async (req, res: Response) => {
  const path = req.query.path as string;

  try {
    const stream = await minioClient.getObject(BUCKET_NAME, path);

    const stat = await minioClient.statObject(BUCKET_NAME, path);
    res.setHeader("Content-Type", stat.metaData["content-type"]);
    stream.pipe(res);
  } catch (err) {
    res.status(404).json({ message: "File not found" });
  }
});

app.use(router);
app.use(errorHandler);

app.get("/", (req: Request, res: Response) => {
  res.send("Hello, worldcddddddddjjjjjjjjjjjjddddddvvv!");
});

setupAssignTasksCron();

app.listen(port, () => {
  console.log(`Server is running at http://localhost:${port}`);
});
