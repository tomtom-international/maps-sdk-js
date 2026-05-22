import { createAzure } from '@ai-sdk/azure';
import type { LanguageModel } from 'ai';

export type AzureConfig =
    | { mode: 'apim'; gatewayBaseUrl: string; apiKey: string; deploymentId: string; apiVersion?: string }
    | { mode: 'direct'; resourceName: string; apiKey: string; deploymentId: string; apiVersion?: string };

function resolveAzureConfig(): AzureConfig | null {
    const resourceName = process.env.AZURE_RESOURCE_NAME;
    const apiKey = process.env.AZURE_API_KEY;
    const deploymentId = process.env.AZURE_DEPLOYMENT_ID;
    const apiVersion = process.env.AZURE_API_VERSION;

    if (!resourceName && !apiKey && !deploymentId) return null;

    if (!deploymentId) {
        throw new Error(
            'AZURE_DEPLOYMENT_ID is required. Add it to plugins/agent-toolkit/.env (e.g. AZURE_DEPLOYMENT_ID=gpt-4.1).',
        );
    }
    if (!apiKey) {
        throw new Error('AZURE_API_KEY is required. Add it to plugins/agent-toolkit/.env.');
    }
    if (!resourceName) {
        throw new Error('Either AZURE_RESOURCE_NAME is required.');
    }
    return { mode: 'direct', resourceName, apiKey, deploymentId, apiVersion };
}

export const azureConfig: AzureConfig | null = resolveAzureConfig();

export const MODEL: LanguageModel | null = azureConfig
    ? azureConfig.mode === 'apim'
        ? createAzure({
              baseURL: azureConfig.gatewayBaseUrl,
              apiKey: azureConfig.apiKey,
              apiVersion: azureConfig.apiVersion,
          }).chat(azureConfig.deploymentId)
        : createAzure({
              resourceName: azureConfig.resourceName,
              apiKey: azureConfig.apiKey,
              apiVersion: azureConfig.apiVersion,
          }).chat(azureConfig.deploymentId)
    : null;
