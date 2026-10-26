import { Request, Response } from "express";
import * as reportService from "../services/reportService";
import { newReportSchema, reportIdSchema } from "../schemas/reportSchema";
import { HttpError } from "../utils/httpError";

export async function getAllReports(req: Request, res: Response) {
  const reports = await reportService.getOpenReports();
  res.json(reports);
}

export async function addReport(req: Request, res: Response) {
  const report = newReportSchema.parse(req.body);
  const saved = await reportService.addReport(report);
  res.json(saved);
}

export async function deleteReport(req: Request, res: Response) {
  const { id } = reportIdSchema.parse(req.params);
  const deleted = await reportService.deleteReport(id);
  if (!deleted) throw new HttpError(404, "Report not found");
  res.json({ message: "Report deleted" });
}
