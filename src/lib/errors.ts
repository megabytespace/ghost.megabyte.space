export class ApiError extends Error {
  readonly code: string;
  readonly details?: unknown;
  readonly status: number;

  constructor(message: string, status = 500, code = "INTERNAL_ERROR", details?: unknown) {
    super(message);
    this.name = "ApiError";
    this.status = status;
    this.code = code;
    this.details = details;
  }
}

export function jsonError(error: ApiError, requestId: string): Response {
  return new Response(
    JSON.stringify({
      error: error.message,
      code: error.code,
      details: error.details,
      requestId,
    }),
    {
      status: error.status,
      headers: {
        "content-type": "application/json; charset=utf-8",
        "x-request-id": requestId,
      },
    },
  );
}
