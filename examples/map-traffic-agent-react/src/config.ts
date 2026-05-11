export const API_KEY = process.env.API_KEY_EXAMPLES;
export const APPLICATIONINSIGHTS_CONNECTION_STRING = process.env.APPLICATIONINSIGHTS_CONNECTION_STRING;

// APIM proxy mode: set AZURE_GATEWAY_BASE_URL to route through Azure API Management.
// Direct mode (default for local dev): set AZURE_RESOURCE_NAME + AZURE_API_KEY.

const gatewayBaseUrl = process.env.AZURE_GATEWAY_BASE_URL;

const resourceName = process.env.AZURE_RESOURCE_NAME;
const apiKey = process.env.AZURE_API_KEY;

// AZURE_MODEL_IDS is the leading source — when set, its comma-separated list
// IS the picker (AZURE_DEPLOYMENT_ID is ignored). When unset, fall back to a
// single deployment via AZURE_DEPLOYMENT_ID so legacy setups keep working.
const modelIds = process.env.AZURE_MODEL_IDS;
const fallbackDeploymentId = process.env.AZURE_DEPLOYMENT_ID;

const parsedModelIds = (modelIds ?? '')
    .split(',')
    .map((s: string) => s.trim())
    .filter(Boolean);

const resolved: string[] =
    parsedModelIds.length > 0 ? parsedModelIds : fallbackDeploymentId ? [fallbackDeploymentId] : [];

if (resolved.length === 0) {
    throw new Error(
        'AZURE_MODEL_IDS (comma-separated) or AZURE_DEPLOYMENT_ID is required. Set one in your .env. AZURE_MODEL_IDS takes precedence and overrides AZURE_DEPLOYMENT_ID when both are set.',
    );
}

export const availableDeployments: readonly string[] = resolved;
export const defaultDeploymentId = resolved[0];

export type AzureConfig =
    | { mode: 'apim'; gatewayBaseUrl: string }
    | { mode: 'direct'; resourceName: string; apiKey: string };

export const azureConfig: AzureConfig = gatewayBaseUrl
    ? { mode: 'apim' as const, gatewayBaseUrl }
    : (() => {
          if (!resourceName) {
              throw new Error(
                  'AZURE_RESOURCE_NAME is required. Create a .env file in the examples/ directory with AZURE_RESOURCE_NAME=your-resource-name',
              );
          }
          if (!apiKey) {
              throw new Error(
                  'AZURE_API_KEY is required. Create a .env file in the examples/ directory with AZURE_API_KEY=your-api-key',
              );
          }
          return { mode: 'direct' as const, resourceName, apiKey };
      })();
