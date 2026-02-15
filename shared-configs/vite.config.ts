import fs from 'node:fs';
import analyze from 'rollup-plugin-analyzer';
import license from 'rollup-plugin-license';
import peerDepsExternal from 'rollup-plugin-peer-deps-external';
import { visualizer } from 'rollup-plugin-visualizer';
import type { UserConfig } from 'vite';
import { defineConfig } from 'vite';
import dts from 'vite-plugin-dts';

export const getSdkVersion = () => {
    const fileContent = fs.readFileSync('../package.json', { encoding: 'utf-8', flag: 'r' });
    const fileContentSerialized = JSON.parse(fileContent);
    const sdkVersion = JSON.stringify(fileContentSerialized.version);
    console.info(`SDK version from package.json is ${sdkVersion}`);
    return sdkVersion;
};

/**
 * Builds a Vite configuration for a main SDK bundle (core/services/map).
 * @param bundleName The name of the bundle to build ('core', 'services', or 'map').
 */
export const buildViteConfig = (bundleName: 'core' | 'services' | 'map'): UserConfig =>
    defineConfig({
        build: {
            lib: {
                entry: './index.ts',
                name: bundleName,
                formats: ['es'],
                fileName: () => `${bundleName}.es.js`,
            },
            minify: 'terser',
            emptyOutDir: true,
            sourcemap: true,
            rollupOptions: {
                // Externalize peer dependencies automatically, plus @tomtom-org/maps-sdk/core
                plugins: [peerDepsExternal()],
                external: ['@tomtom-org/maps-sdk/core'],
            },
        },
        define: {
            __SDK_VERSION__: getSdkVersion(),
        },
        plugins: [
            dts({
                outDirs: 'dist',
                include: ['index.ts', 'src/**/*'],
                exclude: ['**/*.test.ts'],
                bundleTypes: true,
                afterBuild: () => {
                    // Replace relative core imports with the alias in the bundled types
                    const indexDtsPath = './dist/index.d.ts';
                    if (fs.existsSync(indexDtsPath)) {
                        let content = fs.readFileSync(indexDtsPath, 'utf-8');
                        // Replace any relative path to core with the right package name
                        content = content.replace(/from ['"](?:\.\.\/)+core['"]/g, "from '@tomtom-org/maps-sdk/core'");
                        fs.writeFileSync(indexDtsPath, content);
                    }
                },
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
