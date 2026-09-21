import path from 'node:path';
import { visualizer } from 'rollup-plugin-visualizer';
import { defineConfig } from 'vite';
import { resolveExampleEnv } from './exampleBuildEnv.ts';
import { sandpackTailwindPlugin } from './src/sandpack/tailwindPlugin.ts';

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
            sandpackTailwindPlugin({ examplesDir: path.resolve(import.meta.dirname) }),
            // Declaration files are emitted separately by `tsc -p tsconfig.build.json` in the
            // build script — see package.json. Examples ship per-file .d.ts, so they need no
            // bundling pass (unlike core/services/map — see shared-configs/vite.config.ts).
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
