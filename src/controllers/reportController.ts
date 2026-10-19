import { Request, Response } from "express";
import * as reportService from "../services/reportService";

export async function getAllReports(req: Request, res: Response) {
  const reports = await reportService.getOpenReports();
  res.json(reports);
}
