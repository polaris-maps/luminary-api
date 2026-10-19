import { NextFunction, Request, Response } from "express";
import * as buildingService from "../services/buildingService";
import { buildingIdSchema } from "../schemas/buildingSchema";
import { HttpError } from "../utils/httpError";

export async function getAllBuildings(req: Request, res: Response) {
  const buildings = await buildingService.getAllBuildings();
  res.json(buildings);
}

export async function getBuilding(req: Request, res: Response) {
  const { id } = buildingIdSchema.parse(req.params);
  const building = await buildingService.getBuilding(id);
  if (!building) throw new HttpError(404, "Building not found");
  res.json(building);
}
