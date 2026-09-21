import { execFileSync } from 'node:child_process';
import { existsSync, readdirSync } from 'node:fs';
import path from 'node:path';
import { describe, expect, it } from 'vitest';

// `files` in package.json has silently dropped example bundles from the published
// tarball before, with no build or publish failure to catch it. This asserts the
// packed tarball actually contains every already-built example's prod bundle.
describe('published package contents', () => {
    const examplesRoot = path.resolve(__dirname, '../..');

    const exampleDirs = readdirSync(examplesRoot, { withFileTypes: true })
        .filter((entry) => entry.isDirectory())
        .map((entry) => entry.name)
        .filter((name) => !['dist', 'src', 'node_modules', 'coverage'].includes(name));

    const builtExamples = exampleDirs.filter((name) =>
        existsSync(path.join(examplesRoot, name, 'dist', 'prod', 'index.html')),
    );

    it('found at least one already-built example to check against', () => {
        expect(builtExamples.length).toBeGreaterThan(0);
    });

    it("includes every built example's prod bundle and src files in the packed tarball", () => {
        const pnpmBinary = path.join(process.env.PNPM_HOME as string, 'pnpm');
        const fixedPath = [path.dirname(process.execPath), '/usr/local/bin', '/usr/bin', '/bin'].join(path.delimiter);

        const packOutput = execFileSync(pnpmBinary, ['pack', '--dry-run', '--json'], {
            cwd: examplesRoot,
            encoding: 'utf-8',
            env: { ...process.env, PATH: fixedPath },
        });
        const packed: { files: { path: string }[] } = JSON.parse(packOutput);
        const packedPaths = new Set(packed.files.map((packedFile) => packedFile.path));

        const missing = builtExamples.filter((name) => !packedPaths.has(`${name}/dist/prod/index.html`));

        expect(missing, `examples missing from the packed tarball: ${missing.join(', ')}`).toEqual([]);
    }, 60000);
});
