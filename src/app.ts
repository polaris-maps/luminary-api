import express from "express";
import cors from "cors";
import healthRoutes from "./routes/healthRoutes";
import buildingRoutes from "./routes/buildingRoutes";
import { errorHandler } from "./middleware/errorHandler";

const app = express();

app.use(cors());
app.use(express.json({ limit: "4mb" }));

app.use(healthRoutes);
app.use(buildingRoutes);

app.use(errorHandler);

export default app;
