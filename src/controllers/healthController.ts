import type { Request, Response } from "express";
import * as healthService from "../services/healthService";

export function sayHello(req: Request, res: Response) {
  res.json({ message: "Your API works! (200)" });
}

export async function getHealth(req: Request, res: Response) {
  const health = await healthService.getHealth();
  res.json(health);
}
