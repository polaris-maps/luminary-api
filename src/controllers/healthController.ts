import type { Request, Response } from "express";
import * as healthService from "../services/healthService";

// GET /app/
export function sayHello(_req: Request, res: Response): void {
  res.json({ message: "Your API works! (200)" });
}

// GET /app/health
export async function getHealth(_req: Request, res: Response): Promise<void> {
  const health = await healthService.getHealth();
  res.json(health);
}
