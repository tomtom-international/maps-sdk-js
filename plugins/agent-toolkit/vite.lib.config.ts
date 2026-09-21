import { mergeConfig } from 'vite';
import baseConfig from '../plugin-vite-config.ts';
// Sandbox build pieces (turf-UMD alias + the `virtual:sandbox-sdk-utils` plugin) are
// shared with the e2e harness config so the two never drift. Resolved at SDK build
// time only — consumers get the inlined string, not the alias/virtual module.
import { sandboxH3UmdAlias, sandboxSdkUtilsPlugin, sandboxTurfUmdAlias } from './vite-sandbox-build.ts';

export default mergeConfig(baseConfig, {
    resolve: {
        alias: [sandboxTurfUmdAlias, sandboxH3UmdAlias],
    },
    plugins: [sandboxSdkUtilsPlugin()],
});
