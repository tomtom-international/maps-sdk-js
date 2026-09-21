import analyze from 'rollup-plugin-analyzer';
import license from 'rollup-plugin-license';
import { visualizer } from 'rollup-plugin-visualizer';
import { defineConfig } from 'vite';
import { dtsBundlePlugin } from '../shared-configs/dtsBundlePlugin.ts';
import { buildExternal } from '../shared-configs/external.ts';
import { collectThirdPartyNotices, renderThirdPartyNotices } from '../shared-configs/thirdPartyNotices.ts';

// Computed at config-load time (process.cwd() is the building plugin's dir), so the
// default export stays a plain config object — sub-plugins that mergeConfig() it
// (e.g. agent-toolkit) can't merge a callback form. `@tomtom-org/maps-sdk` is already a
// peer dependency of every plugin, so its subpaths (…/core) externalize by prefix.
//
const external = buildExternal(process.cwd());

/**
 * @ignore
 */
export default defineConfig({
    build: {
        lib: {
            entry: './index.ts',
            formats: ['es'],
            fileName: 'index.es',
        },
        minify: 'terser',
        emptyOutDir: true,
        sourcemap: true,
        rolldownOptions: {
            external,
        },
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
                // templates add them from package.json. The JSON sidecar lets the plugin be
                // folded into an aggregated notice (shared-configs/aggregateThirdParty.ts).
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
