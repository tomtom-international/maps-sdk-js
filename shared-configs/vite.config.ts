import fs from 'node:fs';
import terser from '@rollup/plugin-terser';
import analyze from 'rollup-plugin-analyzer';
import { visualizer } from 'rollup-plugin-visualizer';
import { defineConfig, type UserConfig } from 'vite';
import dts from 'vite-plugin-dts';

const getSdkVersion = () => {
    const fileContent = fs.readFileSync('../package.json', { encoding: 'utf-8', flag: 'r' });
    const fileContentSerialized = JSON.parse(fileContent);
    const sdkVersion = JSON.stringify(fileContentSerialized.version);
    console.info(`SDK version from package.json is ${sdkVersion}`);
    return sdkVersion;
};

export const buildViteConfig = (bundleName: 'core' | 'services' | 'map'): UserConfig =>
    defineConfig({
        build: {
            lib: {
                entry: './index.ts',
                name: bundleName,
            },
            emptyOutDir: true,
            sourcemap: true,
            // minification options more in detail in rollup options:
            minify: false,
            rollupOptions: {
                external: ['@cet/maps-sdk-js/core', 'maplibre-gl'],
                output: [
                    // CommonJS (minified)
                    {
                        format: 'cjs',
                        entryFileNames: `${bundleName}.cjs.min.js`,
                        plugins: [terser()],
                    },
                    // CommonJS (non-minified)
                    {
                        format: 'cjs',
                        entryFileNames: `${bundleName}.cjs.js`,
                    },
                    // ES module (minified)
                    {
                        format: 'es',
                        entryFileNames: `${bundleName}.es.js`,
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
                          gzipSize: true,
                      }),
                  ]),
            analyze({
                summaryOnly: true,
                limit: 10,
            }),
        ],
    });
