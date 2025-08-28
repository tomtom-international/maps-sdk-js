import fs from 'node:fs';
import path, { resolve } from 'node:path';
import terser from '@rollup/plugin-terser';
import analyze from 'rollup-plugin-analyzer';
import { visualizer } from 'rollup-plugin-visualizer';
import { defineConfig } from 'vite';
import dts from 'vite-plugin-dts';

const getSdkVersion = () => {
    const fileContent = fs.readFileSync(path.resolve('..', './package.json'), { encoding: 'utf-8', flag: 'r' });
    const fileContentSerialized = JSON.parse(fileContent);
    return JSON.stringify(fileContentSerialized.version);
};

export default defineConfig({
    build: {
        lib: {
            entry: resolve(__dirname, 'index.ts'),
            name: 'services',
        },
        outDir: 'dist',
        sourcemap: true,
        minify: false,
        rollupOptions: {
            external: ['@cet/maps-sdk-js/core'], // Added external dependency
            output: [
                // CommonJS (minified) - matches services.cjs.min.js
                {
                    format: 'cjs',
                    entryFileNames: 'services.cjs.min.js',
                    plugins: [terser()],
                },
                // CommonJS (non-minified) - matches services.cjs.js
                {
                    format: 'cjs',
                    entryFileNames: 'services.cjs.js',
                },
                // ES module (minified) - matches services.es.js
                {
                    format: 'es',
                    entryFileNames: 'services.es.js',
                    plugins: [terser({ module: true })],
                },
            ],
        },
    },
    define: {
        __SDK_VERSION__: getSdkVersion(),
    },
    plugins: [
        dts({
            outDir: 'dist',
            include: ['index.ts', 'src/**/*'],
            exclude: ['**/*.test.ts'],
            rollupTypes: true,
            aliasesExclude: ['@cet/maps-sdk-js/core'], // We don't want to locally resolve @cet/maps-sdk-js/core to the local core paths
        }),
        ...(process.env.CI
            ? []
            : [
                  visualizer({
                      filename: 'bundle-stats.html',
                      open: false,
                  }),
              ]),
        analyze({
            summaryOnly: true,
            limit: 10,
        }),
    ],
});
