import type { NextFunction, Request, Response } from "express";
import { HttpError } from "../utils/httpError";

// Runs when no route matched the URL.
export function notFound(req: Request, _res: Response, next: NextFunction): void {
  next(new HttpError(404, `Route not found: ${req.method} ${req.path}`));
}
