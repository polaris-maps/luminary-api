import type { NextFunction, Request, Response } from "express";
import { ZodError } from "zod";
import { HttpError } from "../utils/httpError";
import type { ErrorResponse } from "../schemas/errorSchema";

// The one place that turns errors into responses.
// Every error response looks like: { "status": 404, "message": "Building not found" }
export function errorHandler(err: unknown, _req: Request, res: Response, _next: NextFunction): void {
  const body = toErrorResponse(err);

  if (body.status === 500) {
    console.error(err); // the details go to the terminal, never to the client
  }

  res.status(body.status).json(body);
}

function toErrorResponse(err: unknown): ErrorResponse {
  // Errors we threw on purpose
  if (err instanceof HttpError) {
    return { status: err.status, message: err.message };
  }

  // Request input that failed a zod schema
  if (err instanceof ZodError) {
    const message = err.issues
      .map((issue) => (issue.path.length > 0 ? `${issue.path.join(".")}: ${issue.message}` : issue.message))
      .join("; ");
    return { status: 400, message };
  }

  // Problems reading the JSON body (thrown by express.json)
  const bodyError = err as { type?: string };
  if (bodyError.type === "entity.parse.failed") {
    return { status: 400, message: "Request body is not valid JSON" };
  }
  if (bodyError.type === "entity.too.large") {
    return { status: 413, message: "Request body is too large" };
  }

  // Anything else is a bug
  return { status: 500, message: "Something went wrong" };
}
