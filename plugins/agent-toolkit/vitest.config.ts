/// <reference types="vitest" />
import path from 'node:path';
import { defineConfig, mergeConfig } from 'vitest/config';
import commonVitestConfig from '../../shared-configs/vitest.config';

export default mergeConfig(
    commonVitestConfig,
    defineConfig({
        resolve: {
            alias: {
                '@tomtom-org/maps-sdk/core': path.resolve(__dirname, '../../core/index.ts'),
                '@tomtom-org/maps-sdk/map': path.resolve(__dirname, '../../map/index.ts'),
                '@tomtom-org/maps-sdk/services': path.resolve(__dirname, '../../services/index.ts'),
            },
        },
    }),
);
