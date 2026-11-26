/**
 * Gives single examples their own Azure model deployment, so that each agent has its own rate
 * limit and usage numbers. `AZURE_EXAMPLE_DEPLOYMENT_IDS` is a comma-separated list of
 * `<example directory>=<deployment>` pairs, e.g.
 * `map-chat-agent-react=chat-agent-gpt-5.1-prod,map-traffic-agent-react=traffic-gpt-5.1-prod`.
 *
 * An example with an entry builds as if `AZURE_DEPLOYMENT_ID` and `AZURE_MODEL_IDS` both named that
 * one deployment. An example without an entry, and every build where the variable is unset, keeps
 * the shared `AZURE_DEPLOYMENT_ID` / `AZURE_MODEL_IDS`.
 *
 * Lives in `src/` and imports nothing from Vite, so the node-side build configs and the
 * browser-side live-editor bundle can share it (same as demos-proxy/demosProxyEnv.ts).
 */
export const EXAMPLE_DEPLOYMENT_IDS_VAR = 'AZURE_EXAMPLE_DEPLOYMENT_IDS';

// The two vars the example sources read to pick a deployment.
const DEPLOYMENT_VARS: ReadonlySet<string> = new Set(['AZURE_DEPLOYMENT_ID', 'AZURE_MODEL_IDS']);

/** The deployment `mapping` assigns to `exampleDirectory`, or undefined when it has no entry. */
export const exampleDeploymentId = (mapping: string | undefined, exampleDirectory: string): string | undefined => {
    for (const entry of (mapping ?? '').split(',')) {
        const [directory, deployment] = entry.split('=').map((part) => part.trim());
        if (directory === exampleDirectory && deployment) {
            return deployment;
        }
    }
    return undefined;
};

/**
 * The value `varName` has for `exampleDirectory`: the example's own deployment for the two
 * deployment vars when the mapping has an entry, otherwise the plain value from `env`.
 */
export const exampleEnvValue = (
    env: Record<string, string | undefined>,
    varName: string,
    exampleDirectory: string,
): string | undefined =>
    (DEPLOYMENT_VARS.has(varName) && exampleDeploymentId(env[EXAMPLE_DEPLOYMENT_IDS_VAR], exampleDirectory)) ||
    env[varName];
