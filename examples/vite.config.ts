import path from 'node:path';
import { visualizer } from 'rollup-plugin-visualizer';
import { defineConfig, loadEnv } from 'vite';
import dts from 'vite-plugin-dts';

// NOTE: This config is meant to build the examples package located in ./src and to be consumed in docs portal for the examples pages
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
                external: ['@codesandbox/sandpack-react', '@codesandbox/sandpack-themes'],
            },
            minify: 'terser',
        },
        plugins: [
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
        ],
        define: {
            'process.env': JSON.stringify(loadEnv(mode, path.resolve('.'), '')),
        },
    };
});
