import { NextFunction, Request, Response } from "express";
import { ZodError } from "zod";

export function errorHandler(err: any, req: Request, res: Response, next: NextFunction) {
  let status = 500;
  let message = "Something went wrong";

  if (err instanceof ZodError) {
    const issue = err.issues[0];
    status = 400;
    message = issue.path.join(".") + ": " + issue.message;
  } else if (err.status) {
    status = err.status;
    message = err.message;
  } else {
    console.error(err);
  }

  res.status(status).json({ status, message });
}
