/// <reference types="vitest" />
import path from 'node:path';
import { defineConfig, mergeConfig } from 'vitest/config';
import commonVitestConfig from '../../shared-configs/vitest.config.ts';

export default mergeConfig(
    commonVitestConfig,
    defineConfig({
        resolve: {
            alias: {
                '@tomtom-org/maps-sdk/core': path.resolve(import.meta.dirname, '../../core/index.ts'),
                '@tomtom-org/maps-sdk/map': path.resolve(import.meta.dirname, '../../map/index.ts'),
                '@tomtom-org/maps-sdk/services': path.resolve(import.meta.dirname, '../../services/index.ts'),
            },
        },
    }),
);
