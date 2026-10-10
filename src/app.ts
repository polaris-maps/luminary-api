import express from "express";
import cors from "cors";
import { db } from "./db";
import buildingsRouter from "./routes/buildings";

const app = express();
app.use(cors());
app.use(express.json({ limit: "4mb" })); // report photos arrive as big base64 strings

app.get("/app/", (_req, res) => {
  res.json({ message: "Your API works! (200)" });
});

app.get("/app/health", async (_req, res) => {
  try {
    await db.execute("SELECT 1");
    res.json({ status: "ok", db: "ok" });
  } catch {
    res.json({ status: "ok", db: "down" });
  }
});

app.use(buildingsRouter);

export default app; // keep this line, deployment needs it
