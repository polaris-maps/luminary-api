import { Request, Response } from "express";
import * as buildingService from "../services/buildingService";

export async function getAllBuildings(req: Request, res: Response) {
  const buildings = await buildingService.getAllBuildings();
  res.json(buildings);
}
