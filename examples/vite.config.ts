import path from 'node:path';
import { visualizer } from 'rollup-plugin-visualizer';
import { defineConfig } from 'vite';
import dts from 'vite-plugin-dts';
import { resolveExampleEnv } from './exampleBuildEnv';
import { sandpackTailwindPlugin } from './src/sandpack/tailwindPlugin';

// NOTE: This config is meant to build the examples package located in ./src and to be consumed in docs portal for the examples pages
export default defineConfig(({ mode }) => {
    // Allowlisted, proxy-redacted env (see exampleBuildEnv.ts). Shared with the
    // per-example dist/prod build so neither config can leak the CI environment.
    const { define: exposedEnv } = resolveExampleEnv(mode, path.resolve('.'));

    return {
        build: {
            lib: {
                entry: './src/index.ts',
                name: 'examples',
                fileName: 'examples',
            },
            emptyOutDir: true,
            sourcemap: true,
            rolldownOptions: {
                external: ['@codesandbox/sandpack-react', '@codesandbox/sandpack-themes'],
            },
            minify: 'terser',
        },
        plugins: [
            sandpackTailwindPlugin({ examplesDir: path.resolve(__dirname) }),
            dts({
                outDirs: 'dist',
                include: ['index.ts', 'src/**/*'],
                exclude: ['**/*.test.ts'],
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
            'process.env': JSON.stringify(exposedEnv),
        },
    };
});
