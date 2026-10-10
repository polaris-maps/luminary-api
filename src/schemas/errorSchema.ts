// Every error response from the API has exactly this shape.
// Example: { "status": 404, "message": "Building not found" }
export type ErrorResponse = {
  status: number;
  message: string;
};
