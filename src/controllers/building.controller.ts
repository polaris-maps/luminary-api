// Reads the request, calls the service, sends the response. Nothing else.
import type { Request, Response } from "express";
import * as buildingService from "../services/building.service";

// GET /app/building/all
export async function getAllBuildings(_req: Request, res: Response): Promise<void> {
  const buildings = await buildingService.getAllBuildings();
  res.json(buildings);
}
