export class OpenRouterError extends Error {
  constructor(message: string) {
    super(message);
    this.name = "OpenRouterError";
  }
}

export class OpenRouterAuthError extends OpenRouterError {
  constructor(message = "Unauthorized - invalid API key") {
    super(message);
    this.name = "OpenRouterAuthError";
  }
}

export class OpenRouterRequestError extends OpenRouterError {
  constructor(
    message: string,
    public readonly details?: string
  ) {
    super(message);
    this.name = "OpenRouterRequestError";
  }
}

export class OpenRouterServerError extends OpenRouterError {
  constructor(
    public readonly statusCode: number,
    message?: string
  ) {
    super(message ?? `Server error: ${statusCode}`);
    this.name = "OpenRouterServerError";
  }
}

export class ResponseParsingError extends OpenRouterError {
  constructor(message = "Invalid JSON in response") {
    super(message);
    this.name = "ResponseParsingError";
  }
}

export class SchemaValidationError extends OpenRouterError {
  constructor(
    message: string,
    public readonly violations?: unknown
  ) {
    super(message);
    this.name = "SchemaValidationError";
  }
}

export class NetworkTimeoutError extends OpenRouterError {
  constructor(message = "Network request timeout") {
    super(message);
    this.name = "NetworkTimeoutError";
  }
}
