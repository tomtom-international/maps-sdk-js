import { loadEnv } from 'vite';
import { DEMOS_PROXY_SERVER_SECRETS } from './src/demos-proxy/demosProxyEnv.ts';
import { EXAMPLE_DEPLOYMENT_IDS_VAR, exampleEnvValue } from './src/exampleDeploymentEnv.ts';

/**
 * Shared build-time env handling for every example build config:
 *   - vite.config.ts            → the @tomtom-org/maps-sdk-examples package (the live editor)
 *   - example-vite.config.ts    → the standalone per-example dist/prod bundles
 *   - the per-example preview config → each example's local live-editor preview
 *
 * It MUST stay a deny-by-default allowlist. `loadEnv(mode, dir, '')` returns the
 * ENTIRE process environment; `define`-ing that as `process.env` bakes every
 * build-machine variable — in CI every runner secret — into the public bundle.
 * Only the vars below are exposed; anything else can never reach the browser.
 */

// The only env vars the example sources and the live-editor build read via `process.env`.
// `scripts/hashExampleBuildEnv.ts` hashes the same list for the Nx task cache.
export const EXAMPLE_ENV_VARS = [
    'API_KEY_EXAMPLES',
    'MOVE_PORTAL_KEY',
    // Claim Resolution API base URL for the claim-intake example (e.g. http://localhost:8080).
    // Ignored in demos-proxy mode, which derives it from DEMOS_PROXY_URL.
    'CLAIMS_API_URL',
    'AZURE_API_KEY',
    'AZURE_RESOURCE_NAME',
    'AZURE_GATEWAY_BASE_URL',
    'AZURE_DEPLOYMENT_ID',
    'AZURE_MODEL_IDS',
    // Per-example deployment overrides for the two vars above (see src/exampleDeploymentEnv.ts).
    EXAMPLE_DEPLOYMENT_IDS_VAR,
    'APPLICATIONINSIGHTS_CONNECTION_STRING',
    'DEMOS_PROXY_URL',
    'HCAPTCHA_SITEKEY',
    'VITE_EVAL_MODE',
    // Agent-eval build only (VITE_EVAL_MODE): route the agent under test to the agent-eval Azure resource so its
    // token usage is tracked there. Only populated during eval runs; empty (and thus not baked) otherwise.
    'AGENT_EVAL_RESOURCE_NAME',
    'AGENT_EVAL_API_KEY',
    'AGENT_EVAL_AUT_DEPLOYMENT_ID',
];

export interface ResolvedExampleEnv {
    /** Allowlisted, secret-redacted map to feed into vite `define['process.env']`. */
    define: Record<string, string>;
    /** True when both DEMOS_PROXY_URL and HCAPTCHA_SITEKEY are set → route via the demos proxy. */
    demosProxyMode: boolean;
}

/**
 * @param exampleDirectory Set by the builds of a single example: that example's entry in
 *   `AZURE_EXAMPLE_DEPLOYMENT_IDS` then replaces the shared deployment vars, and the mapping itself
 *   is left out of the bundle. The live-editor build serves every example from one bundle, so it
 *   omits this and resolves the mapping per example at runtime (`substituteEnvVars`).
 */
export const resolveExampleEnv = (mode: string, envDir: string, exampleDirectory?: string): ResolvedExampleEnv => {
    // loadEnv is typed Record<string, string>, but an unset var is actually
    // `undefined` at runtime — widen so the filter below genuinely narrows.
    const env = loadEnv(mode, envDir, '') as Record<string, string | undefined>;
    const demosProxyMode = !!(env.DEMOS_PROXY_URL && env.HCAPTCHA_SITEKEY);
    const define: Record<string, string> = Object.fromEntries(
        EXAMPLE_ENV_VARS.filter((name) => !(demosProxyMode && DEMOS_PROXY_SERVER_SECRETS.has(name)))
            .filter((name) => !(exampleDirectory && name === EXAMPLE_DEPLOYMENT_IDS_VAR))
            .map((name): readonly [string, string | undefined] => [
                name,
                exampleDirectory ? exampleEnvValue(env, name, exampleDirectory) : env[name],
            ])
            .filter((entry): entry is readonly [string, string] => entry[1] !== undefined),
    );
    return { define, demosProxyMode };
};
