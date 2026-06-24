import { loadEnv } from 'vite';

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
export const EXAMPLE_ENV_VARS = [
    'API_KEY_EXAMPLES',
    'MOVE_PORTAL_KEY',
    'AZURE_API_KEY',
    'AZURE_RESOURCE_NAME',
    'AZURE_GATEWAY_BASE_URL',
    'AZURE_DEPLOYMENT_ID',
    'AZURE_MODEL_IDS',
    'APPLICATIONINSIGHTS_CONNECTION_STRING',
    'DEMO_BFF_URL',
    'HCAPTCHA_SITEKEY',
];

// In proxy mode the Demo-BFF injects these server-side, so they must not appear
// in the bundle at all (mirrors sandpackUtils.PROXY_REDACTED_ENV_VARS).
export const PROXY_ONLY_SERVER_SECRETS = new Set(['API_KEY_EXAMPLES', 'MOVE_PORTAL_KEY', 'AZURE_API_KEY']);

export interface ResolvedExampleEnv {
    /** Allowlisted, proxy-redacted map to feed into vite `define['process.env']`. */
    define: Record<string, string>;
    /** True when both DEMO_BFF_URL and HCAPTCHA_SITEKEY are set → route via the BFF. */
    proxyMode: boolean;
}

export const resolveExampleEnv = (mode: string, envDir: string): ResolvedExampleEnv => {
    // loadEnv is typed Record<string, string>, but an unset var is actually
    // `undefined` at runtime — widen so the filter below genuinely narrows.
    const env = loadEnv(mode, envDir, '') as Record<string, string | undefined>;
    const proxyMode = !!(env.DEMO_BFF_URL && env.HCAPTCHA_SITEKEY);
    const define: Record<string, string> = Object.fromEntries(
        EXAMPLE_ENV_VARS.filter((name) => !(proxyMode && PROXY_ONLY_SERVER_SECRETS.has(name)))
            .map((name): readonly [string, string | undefined] => [name, env[name]])
            .filter((entry): entry is readonly [string, string] => entry[1] !== undefined),
    );
    return { define, proxyMode };
};
