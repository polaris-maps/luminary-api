import express from "express";
import cors from "cors";
import healthRoutes from "./routes/healthRoutes.js";
import buildingRoutes from "./routes/buildingRoutes.js";
import reportRoutes from "./routes/reportRoutes.js";
import routeRoutes from "./routes/routeRoutes.js";
import { errorHandler } from "./middleware/errorHandler.js";

const app = express();

app.use(cors());
app.use(express.json({ limit: "4mb" }));

app.use(healthRoutes);
app.use(buildingRoutes);
app.use(reportRoutes);
app.use(routeRoutes);

app.use(errorHandler);

export default app;
