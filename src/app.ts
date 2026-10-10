import express from "express";
import cors from "cors";
import healthRoutes from "./routes/healthRoutes";
import buildingRoutes from "./routes/buildingRoutes";
import { notFound } from "./middleware/notFound";
import { errorHandler } from "./middleware/errorHandler";

const app = express();
app.use(cors());
app.use(express.json({ limit: "4mb" })); // report photos arrive as big base64 strings

// One line per routes file.
app.use(healthRoutes);
app.use(buildingRoutes);

// These two must stay last.
app.use(notFound);
app.use(errorHandler);

export default app; // keep this line, deployment needs it
