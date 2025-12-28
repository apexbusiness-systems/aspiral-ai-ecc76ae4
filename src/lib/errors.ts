/**
 * aSpiral Error Hierarchy
 * Enterprise-grade error handling with context
 */

export abstract class AppError extends Error {
  constructor(
    message: string,
    public code: string,
    public statusCode: number,
    public context?: Record<string, unknown>
  ) {
    super(message);
    this.name = this.constructor.name;
    Error.captureStackTrace?.(this, this.constructor);
  }

  toJSON() {
    return {
      name: this.name,
      message: this.message,
      code: this.code,
      statusCode: this.statusCode,
      context: this.context,
    };
  }
}

export class SessionError extends AppError {
  constructor(message: string, context?: Record<string, unknown>) {
    super(message, "SESSION_ERROR", 400, context);
  }
}

export class AIServiceError extends AppError {
  constructor(message: string, context?: Record<string, unknown>) {
    super(message, "AI_SERVICE_ERROR", 502, context);
  }
}

export class AuthenticationError extends AppError {
  constructor(message = "Authentication required") {
    super(message, "AUTH_ERROR", 401);
  }
}

export class RateLimitError extends AppError {
  constructor(retryAfter: number) {
    super("Rate limit exceeded", "RATE_LIMIT", 429, { retryAfter });
  }
}

export class ValidationError extends AppError {
  constructor(message: string, errors?: unknown[]) {
    super(message, "VALIDATION_ERROR", 400, { errors });
  }
}

export class NetworkError extends AppError {
  constructor(message = "Network error occurred") {
    super(message, "NETWORK_ERROR", 0);
  }
}

/**
 * Check if error is retriable
 */
export function isRetriableError(error: unknown): boolean {
  if (error instanceof AppError) {
    return (
      error.statusCode >= 500 ||
      error.code === "NETWORK_ERROR" ||
      error.code === "RATE_LIMIT"
    );
  }
  return false;
}

/**
 * Create typed error from unknown
 */
export function createError(
  type: "session" | "ai" | "auth" | "validation" | "network",
  message: string,
  context?: Record<string, unknown>
): AppError {
  switch (type) {
    case "session":
      return new SessionError(message, context);
    case "ai":
      return new AIServiceError(message, context);
    case "auth":
      return new AuthenticationError(message);
    case "validation":
      return new ValidationError(message);
    case "network":
      return new NetworkError(message);
    default:
      return new SessionError(message, context);
  }
}
