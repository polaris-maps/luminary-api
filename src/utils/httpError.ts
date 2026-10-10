// Throw this from a service or controller to send an error response.
// Example: throw new HttpError(404, "Building not found");
export class HttpError extends Error {
  status: number;

  constructor(status: number, message: string) {
    super(message);
    this.status = status;
  }
}
