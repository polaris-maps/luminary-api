import { NextFunction, Request, Response } from "express";
import { ZodError } from "zod";

export function errorHandler(err: any, req: Request, res: Response, next: NextFunction) {
  if (err instanceof ZodError) {
    const issue = err.issues[0];
    const field = issue.path.join(".");
    const message = field ? `${field}: ${issue.message}` : issue.message;
    res.status(400).json({ status: 400, message });
    return;
  }

  if (err.status && err.status < 500) {
    res.status(err.status).json({ status: err.status, message: err.message });
    return;
  }

  console.error(err);
  res.status(500).json({ status: 500, message: "Something went wrong" });
}
