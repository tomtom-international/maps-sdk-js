import commonjs from '@rollup/plugin-commonjs';
import { nodeResolve } from '@rollup/plugin-node-resolve';
import terser from '@rollup/plugin-terser';
import typescript from '@rollup/plugin-typescript';
import type { RollupOptions } from 'rollup';
import analyze from 'rollup-plugin-analyzer';
// @ts-ignore
import includePaths from 'rollup-plugin-includepaths';
import svg from 'rollup-plugin-svg-import';
import { visualizer } from 'rollup-plugin-visualizer';

const includePathOptions = {
    include: {},
    paths: [],
    external: ['@anw/maps-sdk-js/core', 'maplibre-gl'],
    extensions: ['.js', '.json'],
};

const typescriptOptions = {
    tsconfig: './tsconfig.json',
    outputToFilesystem: true,
    exclude: ['**/*.test.ts', '**/jest.config.ts', '**/rollup.config.ts'],
};

export default (): RollupOptions[] => {
    return [
        {
            input: './index.ts',
            output: {
                file: './dist/map.cjs.min.js',
                format: 'cjs',
                sourcemap: true,
            },
            plugins: [
                // has to be before typescript plugin
                includePaths(includePathOptions),
                nodeResolve({ browser: true }),
                typescript(typescriptOptions), //needed for correct order
                commonjs(),
                svg(),
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
                file: './dist/map.cjs.js',
                format: 'cjs',
                sourcemap: true,
            },
            plugins: [
                // has to be before typescript plugin
                includePaths(includePathOptions),
                nodeResolve({ browser: true }),
                typescript(typescriptOptions), //needed for correct order
                commonjs(),
                svg(),
            ],
        },
        {
            input: './index.ts',
            watch: {
                include: './**',
                clearScreen: false,
            },
            output: {
                file: './dist/map.es.js',
                format: 'es',
                sourcemap: true,
            },
            plugins: [
                // has to be before typescript plugin
                includePaths(includePathOptions),
                nodeResolve({ browser: true }),
                typescript(typescriptOptions), //needed for correct order
                commonjs(),
                svg(),
                terser({ module: true }),
                visualizer(),
                analyze({ summaryOnly: true, limit: 10 }),
            ],
        },
    ];
};
