import fs from 'node:fs';
import path from 'node:path';
import terser from '@rollup/plugin-terser';
import { resolve } from 'path';
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
            name: 'core',
        },
        outDir: 'dist',
        sourcemap: true,
        minify: false, // Disable global minify so we control it in rollupOptions
        rollupOptions: {
            output: [
                // ES module (minified)
                {
                    format: 'es',
                    entryFileNames: 'core.es.js',
                    plugins: [terser()],
                },
                // CommonJS (non-minified for debugging)
                {
                    format: 'cjs',
                    entryFileNames: 'core.cjs.js',
                },
                // CommonJS (minified)
                {
                    format: 'cjs',
                    entryFileNames: 'core.cjs.min.js',
                    plugins: [terser()],
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
