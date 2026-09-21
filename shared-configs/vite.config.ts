import fs from 'node:fs';
import analyze from 'rollup-plugin-analyzer';
import license from 'rollup-plugin-license';
import { visualizer } from 'rollup-plugin-visualizer';
import type { UserConfig } from 'vite';
import { defineConfig } from 'vite';
import { dtsBundlePlugin } from './dtsBundlePlugin.ts';
import { buildExternal } from './external.ts';
import { collectThirdPartyNotices, renderThirdPartyNotices } from './thirdPartyNotices.ts';

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
export const buildViteConfig = (bundleName: 'core' | 'services' | 'map'): UserConfig => {
    // Same predicate the declaration build uses (shared-configs/rolldown.dts.config.ts).
    const external = buildExternal(process.cwd(), ['@tomtom-org/maps-sdk/core']);
    return defineConfig({
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
            rolldownOptions: {
                // Externalize peer dependencies + @tomtom-org/maps-sdk/core (native
                // replacement for rollup-plugin-peer-deps-external).
                external,
            },
        },
        define: {
            __SDK_VERSION__: getSdkVersion(),
        },
        plugins: [
            dtsBundlePlugin(external),
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
                    // Peer dependencies are external, so the plugin never sees them — the
                    // templates add them from package.json. The JSON sidecar is what the root
                    // THIRD_PARTY.txt is aggregated from (shared-configs/aggregateThirdParty.ts).
                    output: [
                        {
                            file: './dist/THIRD_PARTY.txt',
                            template: (dependencies) => renderThirdPartyNotices(process.cwd(), dependencies),
                        },
                        {
                            file: './dist/third-party.json',
                            template: (dependencies) =>
                                JSON.stringify(collectThirdPartyNotices(process.cwd(), dependencies), null, 2),
                        },
                    ],
                },
            }),
        ],
    });
};
