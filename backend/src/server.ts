import cors from "cors";
import express from "express";
import helmet from "helmet";
import { config } from "./config.js";
import { logger } from "./logger.js";
import { pitchRouter } from "./routes/pitchRoutes.js";

const app = express();

app.use(
  cors({
    origin: config.cors.origins,
    credentials: true,
  }),
);

app.use(
  helmet({
    crossOriginResourcePolicy: { policy: "cross-origin" },
  }),
);
app.use(express.json({ limit: "10mb" }));
app.use(express.urlencoded({ extended: true, limit: "10mb" }));

app.get("/api/health", (_request, response) => {
  response.json({
    status: "ok",
    timestamp: new Date().toISOString(),
  });
});

app.use("/api", pitchRouter);

app.use((error: unknown, _request: express.Request, response: express.Response, _next: express.NextFunction) => {
  logger.error({ err: error }, "Unhandled error");
  response.status(500).json({
    message: "Something went wrong.",
  });
});

app.listen(config.port, () => {
  logger.info(`Pitch Tuner backend listening on port ${config.port}`);
});
