import { ZodError } from "zod";

export class ApiError extends Error {
  readonly status: number;
  readonly details?: unknown;

  constructor(status: number, message: string, details?: unknown) {
    super(message);
    this.name = "ApiError";
    this.status = status;
    this.details = details;
  }
}

export function toErrorResponse(error: unknown): { status: number; body: { error: string; details?: unknown } } {
  if (error instanceof ApiError) {
    return { status: error.status, body: { error: error.message, details: error.details } };
  }
  if (error instanceof ZodError) {
    return { status: 400, body: { error: "Invalid request", details: error.flatten().fieldErrors } };
  }
  console.error(error);
  return { status: 500, body: { error: "Internal server error" } };
}

export function getErrorMessage(error: unknown): string {
  if (error instanceof ApiError) {
    return error.message;
  }
  if (error instanceof Error) {
    if (error.message === "Failed to fetch" || error.message.includes("NetworkError")) {
      return "Network error — check your connection and try again.";
    }
    return error.message;
  }
  return "Something went wrong. Please try again.";
}
