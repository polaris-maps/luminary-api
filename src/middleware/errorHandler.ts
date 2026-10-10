import { NextFunction, Request, Response } from "express";
import { HttpError } from "../utils/httpError";
import { ZodError } from "zod";

/*
  Global error handler for all endpoints
  Handles Zod errors (input validation), HttpError instances, generic errors.
*/
export function errorHandler(err: any, req: Request, res: Response, next: NextFunction) {
  let message: string;
  let status: number;

  if (err instanceof ZodError) {
    const issue = err.issues[0];
    message = issue.path.join(".") + ": " + issue.message;
    status = 400;
  } else if (err instanceof HttpError || err.status) {
    message = err.message;
    status = err.status;
  } else {
    message = "Internal server error";
    status = 500;
    console.error(err);
  }

  res.status(status).json({ status, message });
}
