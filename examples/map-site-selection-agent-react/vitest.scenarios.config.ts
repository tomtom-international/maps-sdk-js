/// <reference types="vitest" />
import path from 'node:path';
import { withScenario } from '@langwatch/scenario/integrations/vitest/config';
import { loadEnv } from 'vite';
import { defineConfig, mergeConfig } from 'vitest/config';
import baseConfig from '../vitest.config';

// Load AZURE_* (and friends) from examples/.env so src/tests/scenarios/config.ts can build a real
// model. With no credentials present the suites skip via `describe.skipIf(!MODEL)`.
Object.assign(process.env, loadEnv('', path.resolve(__dirname, '..'), ''));

export default withScenario(
    mergeConfig(
        baseConfig,
        defineConfig({
            resolve: {
                alias: {
                    // Resolve the SDK subpaths + the plugin to their SOURCE entry points (same approach as
                    // plugins/agent-toolkit's own scenario vitest config). vitest can't follow the umbrella
                    // package's `exports` subpath map, and the standalone built bundles have module-init
                    // ordering issues when imported in isolation — source resolves cleanly. Tool selection
                    // is identical against source or dist (executes are mocked either way).
                    '@tomtom-org/maps-sdk/core': path.resolve(__dirname, '../../core/index.ts'),
                    '@tomtom-org/maps-sdk/map': path.resolve(__dirname, '../../map/index.ts'),
                    '@tomtom-org/maps-sdk/services': path.resolve(__dirname, '../../services/index.ts'),
                    '@tomtom-org/maps-sdk-plugin-agent-toolkit': path.resolve(
                        __dirname,
                        '../../plugins/agent-toolkit/index.ts',
                    ),
                },
            },
            test: {
                include: ['src/tests/scenarios/**/*.test.ts'],
                // LLM round-trips are slow and variable; per-describe blocks also set timeout + retry.
                testTimeout: 180_000,
                hookTimeout: 180_000,
            },
        }),
    ),
);
