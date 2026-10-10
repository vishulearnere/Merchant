import express from "express";
import cors from "cors";
import { config } from "./config/env.js";
import { connectDB } from "./config/database.js";
import routes from "./routes/index.js";

const app = express();

// Full CORS configuration with preflight handling
app.use(
  cors({
    origin: "*",
    methods: ["GET", "POST", "PUT", "DELETE", "OPTIONS", "PATCH"],
    allowedHeaders: ["Content-Type", "Authorization", "X-Webhook-Secret"],
  })
);

app.use(express.json());

// Mount routes on /v1 (as requested) and / for full flexibility
app.use("/v1", routes);
// app.use("/", routes);

app.use((req, res) => {
  res.status(404).json({ message: `Route ${req.method} ${req.originalUrl} not found` });
});

app.use((err: any, req: express.Request, res: express.Response, next: express.NextFunction) => {
  console.error("Unhandled server error:", err);
  res.status(500).json({ message: err.message || "Internal server error" });
});

async function bootstrap() {
  await connectDB();

  app.listen(config.port, () => {
    console.log(`🚀 Payment Flow Backend running on port ${config.port}`);
    console.log(`📡 Base URL: http://localhost:${config.port}/v1`);
    console.log(`🔗 API Health: http://localhost:${config.port}/v1/health`);
  });
}

bootstrap();

export default app;
