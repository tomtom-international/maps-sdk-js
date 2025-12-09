import path, { basename, dirname } from 'node:path';
import react from '@vitejs/plugin-react';
import analyze from 'rollup-plugin-analyzer';
import { visualizer } from 'rollup-plugin-visualizer';
import { defineConfig, loadEnv } from 'vite';
import dts from 'vite-plugin-dts';

export default defineConfig(({ mode }) => {
    return {
        build: {
            lib: {
                entry: './src/index.ts',
                name: 'examples',
                fileName: 'examples',
            },
            emptyOutDir: true,
            sourcemap: true,
            rollupOptions: {
                external: ['maplibre-gl', '@codesandbox/sandpack-react', '@codesandbox/sandpack-themes'],
            },
        },
        plugins: [
            react(),
            {
                name: 'inject-example-name',
                enforce: 'pre',
                transform(code, id) {
                    if (!id.endsWith('.tsx')) return;

                    const parentFolder = basename(dirname(dirname(id)));

                    // Replace getSandpackFiles("anything")
                    const updated = code
                        .replace(/getSandpackFiles\((.*?)\)/g, `getSandpackFiles("${parentFolder}")`)
                        .replace(/getSandpackDependencies\((.*?)\)/g, `getSandpackDependencies("${parentFolder}")`);

                    return { code: updated, map: null };
                },
            },
            dts({
                outDirs: 'dist',
                include: ['index.ts', 'src/**/*'],
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
        ],
        define: {
            'process.env': JSON.stringify(loadEnv(mode, path.resolve('.'), '')),
        },
    };
});
