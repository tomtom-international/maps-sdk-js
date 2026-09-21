import fs from 'node:fs';
import path from 'node:path';

/**
 * Native replacement for rollup-plugin-peer-deps-external: externalize the building
 * package's own `peerDependencies` and their subpaths (e.g. `maplibre-gl/package.json`,
 * `@tomtom-org/maps-sdk/core`). Returned as a rolldown `external` predicate.
 *
 * Shared by the JS build (`build.rolldownOptions.external`) and the declaration build
 * (`rolldown.dts.config.ts`) so the two can never disagree about what is external — a
 * mismatch would inline a peer dependency's types while importing its runtime.
 * @param cwd Directory of the package being built; its `package.json` is read for peers.
 * @param extraNames Module ids to externalize on top of the peer dependencies.
 */
export const buildExternal = (cwd: string, extraNames: string[] = []): ((id: string) => boolean) => {
    const pkg = JSON.parse(fs.readFileSync(path.join(cwd, 'package.json'), { encoding: 'utf-8' }));
    const names = [...Object.keys(pkg.peerDependencies ?? {}), ...extraNames];
    return (id: string) => names.some((name) => id === name || id.startsWith(`${name}/`));
};
