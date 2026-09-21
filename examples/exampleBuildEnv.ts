import { loadEnv } from 'vite';
import { DEMOS_PROXY_SERVER_SECRETS } from './src/demos-proxy/demosProxyEnv.ts';

/**
 * Shared build-time env handling for BOTH example build configs:
 *   - vite.config.ts            → the @tomtom-org/maps-sdk-examples package (Sandpack)
 *   - example-vite.config.ts    → the standalone per-example dist/prod bundles
 *
 * It MUST stay a deny-by-default allowlist. `loadEnv(mode, dir, '')` returns the
 * ENTIRE process environment; `define`-ing that as `process.env` bakes every
 * build-machine variable — in CI every runner secret — into the public bundle.
 * Only the vars below are exposed; anything else can never reach the browser.
 */

// The only env vars the example sources / sandpackUtils read via `process.env`.
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

export const resolveExampleEnv = (mode: string, envDir: string): ResolvedExampleEnv => {
    // loadEnv is typed Record<string, string>, but an unset var is actually
    // `undefined` at runtime — widen so the filter below genuinely narrows.
    const env = loadEnv(mode, envDir, '') as Record<string, string | undefined>;
    const demosProxyMode = !!(env.DEMOS_PROXY_URL && env.HCAPTCHA_SITEKEY);
    const define: Record<string, string> = Object.fromEntries(
        EXAMPLE_ENV_VARS.filter((name) => !(demosProxyMode && DEMOS_PROXY_SERVER_SECRETS.has(name)))
            .map((name): readonly [string, string | undefined] => [name, env[name]])
            .filter((entry): entry is readonly [string, string] => entry[1] !== undefined),
    );
    return { define, demosProxyMode };
};
