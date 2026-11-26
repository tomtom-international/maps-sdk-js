import { createAzure } from '@ai-sdk/azure';
import { type LanguageModelMiddleware, wrapLanguageModel } from 'ai';

export const API_KEY = process.env.API_KEY_EXAMPLES;

const demosProxyUrl = process.env.DEMOS_PROXY_URL;
const gatewayBaseUrl = process.env.AZURE_GATEWAY_BASE_URL;
const resourceName = process.env.AZURE_RESOURCE_NAME;
const azureApiKey = process.env.AZURE_API_KEY;
const deploymentId = process.env.AZURE_DEPLOYMENT_ID;

const fetchWithCredentials: typeof fetch = (input, init) => fetch(input, { ...init, credentials: 'include' });

/** Azure OpenAI through the demos proxy (which holds the real key), an APIM gateway, or your own key. */
const createDemoAzure = () => {
    if (demosProxyUrl) {
        // The /v1 must be explicit: @ai-sdk/azure appends a bare /chat/completions to a custom
        // (non-Azure) baseURL, and the proxy forwards /llm/* verbatim to Azure OpenAI's /openai/*,
        // where only the v1 surface accepts model-in-body requests without a deployment path.
        return createAzure({
            baseURL: `${demosProxyUrl}/llm/v1`,
            apiKey: 'placeholder',
            fetch: fetchWithCredentials,
        });
    }
    if (gatewayBaseUrl) {
        return createAzure({ baseURL: gatewayBaseUrl, apiKey: azureApiKey ?? 'placeholder' });
    }
    if (!resourceName) {
        throw new Error('AZURE_RESOURCE_NAME is required (or set DEMOS_PROXY_URL for demos-proxy mode).');
    }
    if (!azureApiKey) {
        throw new Error('AZURE_API_KEY is required (or set DEMOS_PROXY_URL for demos-proxy mode).');
    }
    return createAzure({ resourceName, apiKey: azureApiKey });
};

// @ai-sdk/azure sends the deployment name as the model id, and the AI SDK spots a reasoning model by that name
// alone, so a reasoning model deployed under another name would get max_tokens, which Azure rejects.
const reasoningModelMiddleware: LanguageModelMiddleware = {
    transformParams: async ({ params }) => ({
        ...params,
        providerOptions: {
            ...params.providerOptions,
            openai: { ...params.providerOptions?.openai, forceReasoning: true },
        },
    }),
};

/** The chat model of a deployment, flagged as a reasoning model. */
export const createDemoModel = (deploymentId: string) =>
    wrapLanguageModel({ model: createDemoAzure().chat(deploymentId), middleware: reasoningModelMiddleware });

/** The chat model the agent runs on. Throws when `examples/.env` lacks the Azure settings. */
export const createModel = () => {
    if (!deploymentId) {
        throw new Error('AZURE_DEPLOYMENT_ID is required. Set it in examples/.env');
    }
    return createDemoModel(deploymentId);
};
