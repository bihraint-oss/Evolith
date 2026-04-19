type LogContext = {
  action: string;
  domain: string;
  state: string;
  [key: string]: unknown;
};

/**
 * Normalizes unknown thrown values into serializable fields for browser diagnostics.
 */
export function getErrorLogDetails(error: unknown): Record<string, unknown> {
  if (error instanceof Error) {
    const errorWithMetadata = error as Error & {
      code?: unknown;
      isAuthExpired?: unknown;
      status?: unknown;
    };

    return {
      errorCode:
        typeof errorWithMetadata.code === "string"
          ? errorWithMetadata.code
          : undefined,
      errorMessage: error.message,
      errorName: error.name,
      errorStatus:
        typeof errorWithMetadata.status === "number"
          ? errorWithMetadata.status
          : undefined,
      isAuthExpired:
        typeof errorWithMetadata.isAuthExpired === "boolean"
          ? errorWithMetadata.isAuthExpired
          : undefined,
    };
  }

  return {
    errorMessage: String(error),
  };
}

/**
 * Emits a structured browser error event using the shared `{domain}.{action}_{state}` format.
 */
export function logErrorEvent(event: string, context: LogContext): void {
  console.error(event, context);
}
