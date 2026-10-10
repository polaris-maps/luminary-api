import { Request, Response } from "express";
import { HttpError } from "../utils/httpError";

export function notFound(req: Request, res: Response) {
  throw new HttpError(404, `Route not found: ${req.method} ${req.path}`);
}
