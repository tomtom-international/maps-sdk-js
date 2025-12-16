import path from 'node:path';
import analyze from 'rollup-plugin-analyzer';
import { visualizer } from 'rollup-plugin-visualizer';
import { defineConfig, loadEnv } from 'vite';
import dts from 'vite-plugin-dts';
import { sandpackTransformPlugins } from './example-sandpack-vite.config';

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
            ...sandpackTransformPlugins,
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
