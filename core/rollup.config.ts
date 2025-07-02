import fs from 'node:fs';
import path from 'node:path';
import commonjs from '@rollup/plugin-commonjs';
import { nodeResolve } from '@rollup/plugin-node-resolve';
import typescript from '@rollup/plugin-typescript';
import terser from '@rollup/plugin-terser';
import analyze from 'rollup-plugin-analyzer';
import replace from '@rollup/plugin-replace';

const getSDKVersion = () => {
    const fileContent = fs.readFileSync(path.resolve('..', './package.json'), { encoding: 'utf-8', flag: 'r' });
    const fileContentSerialized = JSON.parse(fileContent);

    return fileContentSerialized.version;
};

const SDK_VERSION = getSDKVersion();

const typescriptOptions = {
    tsconfig: './tsconfig.json',
    outputToFilesystem: true,
    exclude: ['**/*.test.ts'],
};

export default () => {
    return [
        {
            input: './index.ts',
            output: {
                file: './dist/core.cjs.min.js',
                format: 'cjs',
                sourcemap: true,
            },
            plugins: [
                // has to be before typescript plugin
                nodeResolve({ browser: true }),
                typescript(typescriptOptions), //needed for correct order
                replace({
                    preventAssignment: true,
                    // biome-ignore lint/style/useNamingConvention: custom param name
                    __SDK_VERSION__: SDK_VERSION,
                }),
                commonjs(),
                terser(),
            ],
        },
        {
            input: './index.ts',
            watch: {
                include: './**',
                clearScreen: false,
            },
            output: {
                file: './dist/core.cjs.js',
                format: 'cjs',
                sourcemap: true,
            },
            plugins: [
                // has to be before typescript plugin
                nodeResolve({ browser: true }),
                typescript(typescriptOptions), //needed for correct order
                replace({
                    preventAssignment: true,
                    // biome-ignore lint/style/useNamingConvention: custom param name
                    __SDK_VERSION__: SDK_VERSION,
                }),
                commonjs(),
            ],
        },
        {
            input: './index.ts',
            watch: {
                include: './**',
                clearScreen: false,
            },
            output: {
                file: './dist/core.es.js',
                format: 'es',
                sourcemap: true,
            },
            plugins: [
                // has to be before typescript plugin
                nodeResolve({ browser: true }),
                typescript(typescriptOptions), //needed for correct order
                replace({
                    preventAssignment: true,
                    // biome-ignore lint/style/useNamingConvention: custom param name
                    __SDK_VERSION__: SDK_VERSION,
                }),
                commonjs(),
                terser({ module: true }),
                analyze({ summaryOnly: true, limit: 10 }),
            ],
        },
    ];
};
