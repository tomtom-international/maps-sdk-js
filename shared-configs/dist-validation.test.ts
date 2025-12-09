import { existsSync, readFileSync } from 'fs';
import { resolve } from 'path';
import { describe, expect, test } from 'vitest';

/**
 * Creates a test suite that validates generated dist contents.
 * E.g. validates that the index.d.ts has no relative path imports.
 *
 * @param packageRoot - The root directory of the package (typically __dirname in the test file)
 * @param packageName - The name of the package for error messages (e.g., 'services', 'map', 'core')
 */
export const createDistValidationTests = (packageRoot: string, packageName: string) => {
    describe(`Distribution validation for ${packageName}`, () => {
        const distTypesPath = resolve(packageRoot, 'dist/index.d.ts');

        test('dist/index.d.ts should exist', () => {
            expect(existsSync(distTypesPath)).toBe(true);
        });

        test('dist/index.d.ts should not contain any relative path imports', () => {
            const content = readFileSync(distTypesPath, 'utf-8');

            // Pattern to match relative imports: from './something' or from "../something"
            // Matches: from './', from "../, from "./", from '../
            const relativeImportPattern = /from\s+['"]\.\.?\//g;
            const matches = content.match(relativeImportPattern);

            if (matches) {
                const lines = content.split('\n');
                const matchedLines = lines
                    .map((line, index) => ({ line, lineNumber: index + 1 }))
                    .filter(({ line }) => /from\s+['"]\.\.?\//.test(line));

                const errorMessage = `Found ${matches.length} relative path import(s) in ${packageName}/dist/index.d.ts:\n${matchedLines
                    .map(({ line, lineNumber }) => `  Line ${lineNumber}: ${line.trim()}`)
                    .join('\n')}`;

                expect.fail(errorMessage);
            }

            expect(matches).toBeNull();
        });
    });
};
