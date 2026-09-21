import { createHash } from 'node:crypto';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { loadEnv } from 'vite';
import { EXAMPLE_ENV_VARS } from '../exampleBuildEnv.ts';

/**
 * Nx runtime input `exampleBuildEnv`: prints `NAME=<sha256>` (or `NAME=unset`) per `EXAMPLE_ENV_VARS` entry,
 * resolved like the example build does (Vite `loadEnv`, `process.env` first). Digests only, never values.
 */
const examplesDirectory = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const environment = loadEnv('production', examplesDirectory, '') as Record<string, string | undefined>;
const digest = (value: string): string => createHash('sha256').update(value).digest('hex');

for (const name of EXAMPLE_ENV_VARS) {
    const value = environment[name];
    console.log(`${name}=${value === undefined ? 'unset' : digest(value)}`);
}
