/**
 * Env vars that must never reach a demos-proxy build's output: the demos proxy
 * injects them server-side from its cookie-gated session. Baking one would expose the
 * secret in the examples' visible source AND overwrite the bootstrap's
 * `apiKey: ''`, silently flipping the SDK back to direct mode (key in the URL,
 * no session cookie => 401). CI always passes them — direct-mode builds need
 * them — so they are redacted here rather than per-workflow.
 *
 * Honoured by both build paths: `resolveExampleEnv` (examples/exampleBuildEnv.ts)
 * drops them from `define['process.env']`, `substituteEnvVars`
 * (examples/src/sandpack/sandpackUtils.ts) substitutes them as `undefined`.
 * Lives in `src/` and imports nothing from Vite, so the node-side build configs
 * and the browser-side Sandpack bundle can share it.
 */
export const DEMOS_PROXY_SERVER_SECRETS = new Set([
    'API_KEY_EXAMPLES',
    'MOVE_PORTAL_KEY',
    'AZURE_API_KEY',
    'AGENT_EVAL_API_KEY',
]);
