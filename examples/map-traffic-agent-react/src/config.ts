import { createAzure } from '@ai-sdk/azure';

export const API_KEY = process.env.API_KEY_EXAMPLES;
export const APPLICATIONINSIGHTS_CONNECTION_STRING = process.env.APPLICATIONINSIGHTS_CONNECTION_STRING;

const demoBffUrl = process.env.DEMO_BFF_URL;
const gatewayBaseUrl = process.env.AZURE_GATEWAY_BASE_URL;
const resourceName = process.env.AZURE_RESOURCE_NAME;
const azureApiKey = process.env.AZURE_API_KEY;

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

// Agent-eval build (VITE_EVAL_MODE=true, set by `pnpm test:agent-eval`): route the AUT through the agent-eval
// resource + its own deployment so its token usage is tracked there alongside the user agent and judge. A
// plain build leaves these unset and the normal SDK config stands untouched.
const evalMode = process.env.VITE_EVAL_MODE === 'true';
const evalResourceName = process.env.AGENT_EVAL_RESOURCE_NAME;
const evalApiKey = process.env.AGENT_EVAL_API_KEY;
const evalAutDeploymentId = process.env.AGENT_EVAL_AUT_DEPLOYMENT_ID;

if (evalMode && !(evalResourceName && evalApiKey && evalAutDeploymentId)) {
    throw new Error(
        'VITE_EVAL_MODE=true requires AGENT_EVAL_RESOURCE_NAME, AGENT_EVAL_API_KEY, and AGENT_EVAL_AUT_DEPLOYMENT_ID',
    );
}

export const availableDeployments: readonly string[] =
    evalMode && evalAutDeploymentId ? [evalAutDeploymentId] : resolved;

if (availableDeployments.length === 0) {
    throw new Error(
        'AZURE_MODEL_IDS (comma-separated) or AZURE_DEPLOYMENT_ID is required. Set one in your .env. AZURE_MODEL_IDS takes precedence and overrides AZURE_DEPLOYMENT_ID when both are set.',
    );
}

export const defaultDeploymentId = availableDeployments[0];

const fetchWithCredentials: typeof fetch = (input, init) => fetch(input, { ...init, credentials: 'include' });

/**
 * Build an Azure OpenAI client appropriate for the runtime:
 *  - Demo-BFF proxy mode: route through `<bff>/llm`, BFF holds the real key
 *  - APIM gateway mode: route through the configured gateway base URL
 *  - Direct mode (local dev): talk to api.openai.azure.com with the user's key
 */
export const createDemoAzure = () => {
    // For agent-eval runs, we point to the agent-eval resource to track the tokens
    if (evalMode && evalResourceName && evalApiKey) {
        return createAzure({ resourceName: evalResourceName, apiKey: evalApiKey });
    }

    if (demoBffUrl) {
        return createAzure({
            baseURL: `${demoBffUrl}/llm`,
            apiKey: 'placeholder',
            fetch: fetchWithCredentials,
        });
    }
    if (gatewayBaseUrl) {
        return createAzure({ baseURL: gatewayBaseUrl, apiKey: azureApiKey ?? 'placeholder' });
    }
    if (!resourceName) {
        throw new Error('AZURE_RESOURCE_NAME is required (or set DEMO_BFF_URL for proxy mode).');
    }
    if (!azureApiKey) {
        throw new Error('AZURE_API_KEY is required (or set DEMO_BFF_URL for proxy mode).');
    }
    return createAzure({ resourceName, apiKey: azureApiKey });
};
