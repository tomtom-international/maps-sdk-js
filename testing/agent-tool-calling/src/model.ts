import { createAzure } from '@ai-sdk/azure';
import type { LanguageModel } from 'ai';

// Azure OpenAI model resolution shared by every map-agent tool-selection scenario suite. Reads the
// AZURE_* env (loaded by each suite's vitest config via `loadEnv`) and returns an EMPTY list when
// credentials are absent so suites can `describe.skipIf(!MODEL)` instead of failing — keeps the scenario
// commands a no-op for contributors without Azure access. Direct mode only: the gateway/APIM path is for
// public apps and is superseded by the demo-proxy, neither of which the headless test runner uses.

// We test every scenario against MULTIPLE models so a prompt that passes on one model can't silently
// regress on another. The model list comes from the same env the demo apps use — AZURE_MODEL_IDS (a
// comma-separated list, the leading picker) or the single AZURE_DEPLOYMENT_ID — defaulting to the pair
// below. Reusing the runtime vars keeps the tested models in step with what the apps actually run.
const DEFAULT_DEPLOYMENTS = ['gpt-5.1', 'gpt-4.1'];

export type AzureConfig = { resourceName: string; apiKey: string; apiVersion?: string };

const resolveAzureConfig = (): AzureConfig | null => {
    const resourceName = process.env.AZURE_RESOURCE_NAME;
    const apiKey = process.env.AZURE_API_KEY;
    const apiVersion = process.env.AZURE_API_VERSION;
    if (!resourceName && !apiKey) return null;
    if (!apiKey) {
        throw new Error('AZURE_API_KEY is required to run the scenario suite.');
    }
    if (!resourceName) {
        throw new Error('AZURE_RESOURCE_NAME is required to run the scenario suite.');
    }
    return { resourceName, apiKey, apiVersion };
};

// The deployment names to test against — AZURE_MODEL_IDS (the comma-separated picker, leading, matching
// the demo apps' precedence) then the single AZURE_DEPLOYMENT_ID, falling back to the default pair.
const resolveDeploymentIds = (): string[] => {
    const raw = process.env.AZURE_MODEL_IDS ?? process.env.AZURE_DEPLOYMENT_ID ?? '';
    const ids = raw
        .split(',')
        .map((id) => id.trim())
        .filter(Boolean);
    return ids.length ? ids : DEFAULT_DEPLOYMENTS;
};

/** A model under test, paired with its deployment id for readable per-model reporting. */
export type ScenarioModel = { id: string; model: LanguageModel };

/** Builds one model per configured deployment, or an empty list when no credentials are present. */
export const resolveAzureModels = (): ScenarioModel[] => {
    const config = resolveAzureConfig();
    if (!config) return [];
    const provider = createAzure({
        resourceName: config.resourceName,
        apiKey: config.apiKey,
        apiVersion: config.apiVersion,
    });
    return resolveDeploymentIds().map((id) => ({ id, model: provider.chat(id) }));
};

/** The resolved Azure config (null when credentials are absent). */
export const azureConfig: AzureConfig | null = resolveAzureConfig();

/** Every model the scenarios run against, evaluated once at import (after the vitest config loaded env). */
export const MODELS: ScenarioModel[] = resolveAzureModels();

/** Truthy when at least one model is configured — used by `describe.skipIf(!MODEL)` to skip without creds. */
export const MODEL: LanguageModel | null = MODELS[0]?.model ?? null;
