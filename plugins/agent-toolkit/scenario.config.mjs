import { defineConfig } from "@langwatch/scenario";
import { createAzure } from "@ai-sdk/azure";


const gatewayBaseUrl = import.meta.env.VITE_AZURE_GATEWAY_BASE_URL;
const resourceName = import.meta.env.VITE_AZURE_RESOURCE_NAME;   
const apiKey = import.meta.env.VITE_AZURE_API_KEY;
const deploymentId = import.meta.env.VITE_AZURE_DEPLOYMENT_ID;
const apiVersion = import.meta.env.VITE_AZURE_API_VERSION;

if (!deploymentId) {
  throw new Error(
    "AZURE_DEPLOYMENT_ID is required. Add it to plugins/agent-toolkit/.env (e.g. AZURE_DEPLOYMENT_ID=gpt-4.1).",
  );
}
if (!apiKey) {
  throw new Error("AZURE_API_KEY is required. Add it to plugins/agent-toolkit/.env.");
}

const azure = gatewayBaseUrl
  ? createAzure({ baseURL: gatewayBaseUrl, apiKey, apiVersion })
  : (() => {
      if (!resourceName) {
        throw new Error(
          "Either AZURE_GATEWAY_BASE_URL (APIM) or AZURE_RESOURCE_NAME (direct) is required.",
        );
      }
      return createAzure({ resourceName, apiKey, apiVersion });
    })();

export default defineConfig({
  defaultModel: {
    model: azure.chat(deploymentId),
    maxTokens: 1000,
  },
  headless: false,
});