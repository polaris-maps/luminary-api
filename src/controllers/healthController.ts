import { Request, Response } from "express";
import * as healthService from "../services/healthService";

export function health(req: Request, res: Response) {
  res.json({ message: "Health Check (200)" });
}

export async function getHealth(req: Request, res: Response) {
  const health = await healthService.getHealth();
  res.json(health);
}
