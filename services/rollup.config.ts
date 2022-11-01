import typescript from "@rollup/plugin-typescript";
import commonjs from "@rollup/plugin-commonjs";
import { nodeResolve } from "@rollup/plugin-node-resolve";
import { terser } from "rollup-plugin-terser";
// @ts-ignore
import includePaths from "rollup-plugin-includepaths";

const includePathOptions = {
    include: {},
    paths: [],
    external: ["@anw/go-sdk-js/core", "axios"],
    extensions: [".js", ".json"]
};

const typescriptOptions = {
    tsconfig: "./tsconfig.json",
    outputToFilesystem: true,
    exclude: ["**/*.test.ts"]
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
                typescript(typescriptOptions), //needed for correct order
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
                typescript(typescriptOptions), //needed for correct order
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
                typescript(typescriptOptions), //needed for correct order
                commonjs()
            ]
        }
    ];
};
