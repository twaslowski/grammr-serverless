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

  return { endpoint: endpoint, apiKey: apiKey };
}
