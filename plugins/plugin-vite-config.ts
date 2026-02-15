import analyze from 'rollup-plugin-analyzer';
import license from 'rollup-plugin-license';
import peerDepsExternal from 'rollup-plugin-peer-deps-external';
import { visualizer } from 'rollup-plugin-visualizer';
import { defineConfig } from 'vite';
import dts from 'vite-plugin-dts';

/**
 * @ignore
 */
export default defineConfig({
    build: {
        lib: {
            entry: './index.ts',
            formats: ['es'],
            fileName: 'index.es.js',
        },
        minify: 'terser',
        emptyOutDir: true,
        sourcemap: true,
        rollupOptions: {
            // Externalize peer dependencies automatically, plus SDK packages
            plugins: [peerDepsExternal()],
            external: ['@tomtom-org/maps-sdk/core', '@tomtom-org/maps-sdk/services', '@tomtom-org/maps-sdk/map'],
        },
    },
    plugins: [
        dts({
            outDirs: 'dist',
            include: ['**/*'],
            exclude: ['**/*.test.ts'],
            bundleTypes: true,
        }),
        ...(process.env.CI
            ? []
            : [
                  visualizer({
                      filename: 'bundle-stats.html',
                      open: false,
                      gzipSize: true,
                  }),
              ]),
        analyze({
            summaryOnly: true,
            limit: 10,
        }),
        license({
            thirdParty: {
                output: { file: './dist/THIRD_PARTY.txt' },
            },
        }),
    ],
});
