import type { Plugin } from 'vite';

// Emits the bundled `dist/index.d.ts` in a declaration-only rolldown pass, once vite has
// written the JS bundle. Defined here and shared by every published workspace so `vite build`
// stays the single build command and the logic exists in one place.
//
// Paths are relative to the building package (process.cwd()), matching `build.lib.entry`.
//
// Why this runs beside the JS build rather than inside it: `dts()` in
// `build.rolldownOptions.plugins` — the plugin's own one-pass usage — makes the .d.ts a chunk
// in vite's JS output pipeline, and `vite:terser` has no chunk filter, so it minifies the
// declarations too and dies on the first `type` alias. Vite's native minifier parses them
// fine, but costs ~20% bundle size (map: 180.9 kB -> 216.4 kB raw, 56.6 -> 61.6 kB gzip) on
// the files size-limit tracks. One-pass also renames the .d.ts through `lib.fileName` and has
// license/analyze attribute declarations to the bundle (THIRD_PARTY.txt picking up `@types/*`).
//
// The pass re-bundles no implementation code: `emitDtsOnly` replaces every module body with
// `export {}` before rolldown sees it and drops the non-declaration chunks, so the only real
// work is tsc's declaration emit — the same work a one-pass build would do.
export const dtsBundlePlugin = (external: string[] | ((id: string) => boolean)): Plugin => ({
    name: 'rolldown-dts-bundle',
    async closeBundle() {
        const { rolldown } = await import('rolldown');
        const { dts } = await import('rolldown-plugin-dts');
        const bundle = await rolldown({
            input: './index.ts',
            external,
            plugins: [dts({ generator: 'tsc', emitDtsOnly: true, tsconfig: './tsconfig.json' })],
        });
        await bundle.write({ dir: 'dist', format: 'es' });
        await bundle.close();
    },
});
