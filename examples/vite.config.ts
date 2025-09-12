import path from 'node:path';
import { visualizer } from 'rollup-plugin-visualizer';
import { defineConfig, loadEnv } from 'vite';
import { viteSingleFile } from 'vite-plugin-singlefile';

// NOTE: This config is meant to be reused by each example. Thus, any configured paths are likely relatively to each example folder.
export default defineConfig(({ mode }) => {
    return {
        root: '.',
        base: './',
        build: {
            target: 'esnext',
            minify: 'esbuild',
            emptyOutDir: true,
            assetsInlineLimit: Number.POSITIVE_INFINITY, // Inline all assets },
        },
        plugins: [
            ...(process.env.CI
                ? []
                : [
                      visualizer({
                          filename: 'bundle-stats.html',
                          open: false,
                          gzipSize: true,
                      }),
                  ]),
            viteSingleFile({ removeViteModuleLoader: true }),
        ],
        server: { port: 9022 },
        resolve: {
            alias: {
                // We ensure to locally alias imports from @cet/maps-sdk-js/core from the SDK code itself to the locally built core package.
                '@cet/maps-sdk-js/core': path.resolve('../../core/dist/core.es.js'),
            },
        },
        define: {
            'process.env': JSON.stringify(loadEnv(mode, path.resolve('..'), '')),
        },
    };
});
