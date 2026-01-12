export interface LogContext {
  function_name: string;
  user_id?: string;
  request_id?: string;
  [key: string]: unknown;
}

export interface CanonicalLogLine {
  timestamp: string;
  function_name: string;
  user_id?: string;
  request_id?: string;
  duration_ms: number;
  status: "success" | "error";
  status_code: number;
  error?: string;
  metadata?: Record<string, unknown>;
}

/**
 * Creates a request logger that tracks timing and produces a canonical log line.
 */
export function createRequestLogger(functionName: string, userId?: string) {
  const startTime = Date.now();
  const requestId = crypto.randomUUID();

  return {
    requestId,

    /**
     * Log a successful request with a canonical log line.
     */
    success(statusCode: number = 200, metadata?: Record<string, unknown>) {
      const logLine: CanonicalLogLine = {
        timestamp: new Date().toISOString(),
        function_name: functionName,
        user_id: userId,
        request_id: requestId,
        duration_ms: Date.now() - startTime,
        status: "success",
        status_code: statusCode,
        metadata,
      };
      console.log(JSON.stringify(logLine));
    },

    /**
     * Log a failed request with a canonical log line.
     */
    error(
      statusCode: number,
      error: string,
      metadata?: Record<string, unknown>,
    ) {
      const logLine: CanonicalLogLine = {
        timestamp: new Date().toISOString(),
        function_name: functionName,
        user_id: userId,
        request_id: requestId,
        duration_ms: Date.now() - startTime,
        status: "error",
        status_code: statusCode,
        error,
        metadata,
      };
      console.error(JSON.stringify(logLine));
    },
  };
}
