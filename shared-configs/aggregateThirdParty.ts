import path from 'node:path';
import { fileURLToPath } from 'node:url';
import {
    packageTarget,
    pluginPackageDirectories,
    sdkTarget,
    unbuiltPackages,
    writeNotices,
} from './thirdPartyAggregation.ts';

/**
 * Writes the `THIRD_PARTY.txt` a `LICENSE.txt` points at, from the per-bundle notices the
 * builds emit.
 *
 * With no arguments it aggregates the three SDK bundles into the repo root, listing every
 * component once even when several bundles require it. With package directories it writes
 * one notice per package instead, next to that package's own `LICENSE.txt` — plugins ship
 * as separate npm packages and their peer dependencies are their own. `--plugins` stands for
 * every buildable package under `plugins/`, so adding a plugin needs no script change.
 *
 * Reads the `dist/third-party.json` sidecars rather than re-deriving the dependency set, so
 * the committed file can never disagree with what the bundles ship. Run it after the bundles
 * are built: `pnpm build:third-party` (SDK) or `pnpm build:third-party:plugins`.
 *
 * Usage: `node shared-configs/aggregateThirdParty.ts [--best-effort] [--plugins] [packageDir...]`
 */

const repositoryRoot = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');

const args = process.argv.slice(2);
// `--best-effort` is for the `prepare` hook, which runs on every install and must never fail
// one: refresh the notices where possible, and report rather than throw where not. Builds run
// without it, since a notice file they cannot refresh is a hard error.
const bestEffort = args.includes('--best-effort');
const named = args.filter((arg) => !arg.startsWith('--'));
const requested = args.includes('--plugins') ? [...pluginPackageDirectories(repositoryRoot), ...named] : named;
const targets =
    requested.length > 0
        ? requested.map((packageDirectory) => packageTarget(repositoryRoot, packageDirectory))
        : [sdkTarget];

const report = (message: string): void => {
    if (!bestEffort) throw new Error(message);

    console.warn(message);
};

for (const target of targets) {
    // On a fresh clone `pnpm install` runs before anything is built, so there is nothing to
    // generate from yet.
    const unbuilt = unbuiltPackages(repositoryRoot, target);
    if (unbuilt.length > 0) {
        report(
            `${target.output} was left unchanged: no build output for ${unbuilt.join(', ')}. Build first (\`pnpm build:sdk\`, \`pnpm build:plugins\`).`,
        );
        continue;
    }

    const { components, problems, written } = writeNotices(repositoryRoot, target);
    if (!written) {
        report(
            [
                `${target.output} was left unchanged: the build output it is generated from does not match the installed dependencies:`,
                ...problems,
                'Rebuild to refresh it (`pnpm build:sdk`, `pnpm build:plugins`).',
            ].join('\n'),
        );
        continue;
    }

    console.info(`Wrote ${target.output}: ${components} components from ${target.packageDirectories.join(', ')}.`);
}
