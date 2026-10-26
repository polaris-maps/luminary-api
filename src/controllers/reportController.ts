import { Request, Response } from "express";
import * as reportService from "../services/reportService";
import { newReportSchema } from "../schemas/reportSchema";

export async function getAllReports(req: Request, res: Response) {
  const reports = await reportService.getOpenReports();
  res.json(reports);
}

export async function addReport(req: Request, res: Response) {
  const report = newReportSchema.parse(req.body);
  const saved = await reportService.addReport(report);
  res.json(saved);
}
