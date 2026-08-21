import { NextResponse } from "next/server";

export interface ApiGatewayConfig {
  endpoint: string;
  apiKey: string;
}

export function getApiGatewayConfig(): ApiGatewayConfig | undefined {
  const endpoint = process.env.API_GW_URL;
  const apiKey = process.env.API_GW_API_KEY;

  if (!endpoint || !apiKey) {
    return undefined;
  }

  return { endpoint, apiKey };
}

/** Thrown when API_GW_URL / API_GW_API_KEY are not set. */
export class ApiGatewayNotConfiguredError extends Error {
  constructor() {
    super("API_GW_URL or API_GW_API_KEY not configured");
    this.name = "ApiGatewayNotConfiguredError";
  }
}

/**
 * POSTs a JSON body to `path` on the API Gateway and returns the raw Response.
 *
 * Callers own the response handling, because the Lambdas behind the gateway
 * differ in what they return (JSON, binary audio) and in how their failures
 * should be surfaced to the client.
 *
 * @throws ApiGatewayNotConfiguredError if the gateway env vars are absent.
 */
export async function callApiGateway(
  path: string,
  body: unknown,
): Promise<Response> {
  const config = getApiGatewayConfig();

  if (!config) {
    throw new ApiGatewayNotConfiguredError();
  }

  return fetch(`${config.endpoint}${path}`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "x-api-key": config.apiKey,
    },
    body: JSON.stringify(body),
  });
}

/**
 * Standard 503 for a request that could not be forwarded because the gateway
 * is not configured. Re-throws anything else so it reaches the route's own
 * error handling.
 */
export function apiGatewayNotConfiguredResponse(error: unknown): NextResponse {
  if (!(error instanceof ApiGatewayNotConfiguredError)) {
    throw error;
  }

  console.error(error.message);

  return NextResponse.json({ error: "Service not configured" }, { status: 503 });
}
