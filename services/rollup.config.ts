import commonjs from "@rollup/plugin-commonjs";
import { nodeResolve } from "@rollup/plugin-node-resolve";
import typescript from "@rollup/plugin-typescript";
import { terser } from "rollup-plugin-terser";
// @ts-ignore
import includePaths from "rollup-plugin-includepaths";

const includePathOptions = {
    include: {},
    paths: [],
    external: ['@anw/go-sdk-js/core'],
    extensions: ['.js', '.json']
};

export default () => {
    return [
        {
            input: "./index.ts",
            output: {
                file: "./dist/services.cjs.min.js",
                format: "cjs",
                sourcemap: true
            },
            plugins: [
                includePaths(includePathOptions),
                // has to be before typescript plugin
                nodeResolve({ browser: true }),
                typescript({ tsconfig: "./tsconfig.json", outputToFilesystem: true }), //needed for correct order
                commonjs(),
                terser()
            ]
        },
        {
            input: "./index.ts",
            watch: {
                include: "./**",
                clearScreen: false
            },
            output: {
                file: "./dist/services.cjs.js",
                format: "cjs",
                sourcemap: true
            },
            plugins: [
                includePaths(includePathOptions),
                // has to be before typescript plugin
                nodeResolve({ browser: true }),
                typescript({ tsconfig: "./tsconfig.json", outputToFilesystem: true }), //needed for correct order
                commonjs()
            ]
        },
        {
            input: "./index.ts",
            watch: {
                include: "./**",
                clearScreen: false
            },
            output: {
                file: "./dist/services.es.js",
                format: "es",
                sourcemap: true
            },
            plugins: [
                includePaths(includePathOptions),
                // has to be before typescript plugin
                nodeResolve({ browser: true }),
                typescript({ tsconfig: "./tsconfig.json", outputToFilesystem: true }), //needed for correct order
                commonjs()
            ]
        }
    ];
};
