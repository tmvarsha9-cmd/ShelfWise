// Express application, middleware, routes, and error responses.
import express from "express";
import cors from "cors";
import productsRouter from "./routes/products.js";
import insightsRouter from "./routes/insights.js";

const app = express();
app.use(cors());
app.use(express.json());
app.use("/api/products", productsRouter);
app.use("/api/insights", insightsRouter);
app.use("/api", insightsRouter);
app.use((error, _req, res, _next) => {
  console.error(error);
  res.status(500).json({ error: "Internal server error" });
});

export default app;
