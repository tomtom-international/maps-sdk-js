import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { buildPlaywrightConfig } from '../playwright.config';

const configDir = path.dirname(fileURLToPath(import.meta.url));

// Playwright specs run in plain Node — Vite's env injection is browser-only.
// Load the agent-eval .env (VITE_-prefixed keys) and alias each key to the
// bare name the example config expects (VITE_AZURE_API_KEY → AZURE_API_KEY).
try {
    process.loadEnvFile(path.resolve(configDir, '../../agent-eval/.env'));
} catch {
    // .env not present — fall back to shell-provided env vars
}

for (const [key, value] of Object.entries(process.env)) {
    if (key.startsWith('VITE_') && value) {
        process.env[key.slice('VITE_'.length)] ??= value;
    }
}

export default buildPlaywrightConfig();
