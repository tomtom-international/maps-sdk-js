import fs from 'node:fs';
import terser from '@rollup/plugin-terser';
import analyze from 'rollup-plugin-analyzer';
import { visualizer } from 'rollup-plugin-visualizer';
import { defineConfig } from 'vite';
import dts from 'vite-plugin-dts';

export default defineConfig({
    build: {
        lib: {
            entry: './src/index.ts',
            name: 'examples',
            fileName: 'examples',
        },
        emptyOutDir: true,
        sourcemap: true,
        // minification options more in detail in rollup options:
        minify: false,
        rollupOptions: {
            output: [
                // ES module (minified)
                {
                    format: 'es',
                    entryFileNames: `examples.es.js`,
                    plugins: [terser({ module: true })],
                },
            ],
        },
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
                      gzipSize: true,
                  }),
              ]),
        analyze({
            summaryOnly: true,
            limit: 10,
        }),
    ],
});
