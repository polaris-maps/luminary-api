import express from "express";
import cors from "cors";
import healthRoutes from "./routes/health.routes";
import buildingRoutes from "./routes/building.routes";

const app = express();
app.use(cors());
app.use(express.json({ limit: "4mb" })); // report photos arrive as big base64 strings

// One line per routes file.
app.use(healthRoutes);
app.use(buildingRoutes);

export default app; // keep this line, deployment needs it
