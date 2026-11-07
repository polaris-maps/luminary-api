import { Request, Response } from "express";
import * as reportService from "../services/reportService.js";
import * as routingService from "../services/routingService.js";
import { routeRequestSchema } from "../schemas/routeSchema.js";
import { getMap } from "../utils/graph.js";

const campus = routingService.prepareMap(getMap());

export async function getRoute(req: Request, res: Response) {
  const trip = routeRequestSchema.parse(req.body);
  const reports = await reportService.getOpenReports();
  res.json(routingService.findWalkingRoute(campus, trip, reports));
}
