import { NextFunction, Request, Response } from "express";
import { HttpError } from "../utils/httpError.js";
import { ZodError } from "zod";

/*
  Global error handler for all endpoints
  Handles Zod errors (input validation), HttpError instances, generic errors.
  Sends { status, message }, plus a code when the error has one, so the app can tell errors apart without reading the message.
*/
export function errorHandler(err: any, req: Request, res: Response, next: NextFunction) {
  let message: string;
  let status: number;
  let code: string | undefined;

  if (err instanceof ZodError) {
    const issue = err.issues[0];
    message = issue.path.join(".") + ": " + issue.message;
    status = 400;
    code = "INVALID_REQUEST";
  } else if (err instanceof HttpError || err.status) {
    message = err.message;
    status = err.status;
    code = err.code;
  } else {
    message = "Internal server error";
    status = 500;
    code = "INTERNAL_ERROR";
    console.error(err);
  }

  if (code) {
    res.status(status).json({ status, code, message });
    return;
  }
  res.status(status).json({ status, message });
}
