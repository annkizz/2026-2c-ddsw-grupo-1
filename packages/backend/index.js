import "dotenv/config";
import express from "express";
import cors from "cors";
import router from "./routes/router.js";
import swaggerUi from "swagger-ui-express";
import swaggerSpec from "./swagger.js";
import { errorHandler } from "./middlewares/errorHandler.js";
import { notFoundHandler } from "./middlewares/notFoundHandler.js";

const app = express();
app.use(express.json());
app.use(
  cors({
    origin: process.env.ALLOWED_ORIGINS
      ? process.env.ALLOWED_ORIGINS.split(",").map((o) => o.trim())
      : true,
  }),
);
app.use(router);

app.use("/api-docs", swaggerUi.serve, swaggerUi.setup(swaggerSpec));

app.get("/healthcheck", (req, res) => {
  res.status(200).json({
    status: "ok",
    timestamp: new Date().toISOString(),
  });
});

app.use(notFoundHandler);
app.use(errorHandler);

const PORT = process.env.SERVER_PORT;

app.listen(PORT, () => {
  console.log(`Backend escuchando en puerto ${PORT}`);
});
