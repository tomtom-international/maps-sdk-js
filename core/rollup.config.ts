import commonjs from "@rollup/plugin-commonjs";
import { nodeResolve } from "@rollup/plugin-node-resolve";
import typescript from "@rollup/plugin-typescript";
import terser from "@rollup/plugin-terser";

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
                file: "./dist/core.cjs.min.js",
                format: "cjs",
                sourcemap: true
            },
            plugins: [
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
                file: "./dist/core.cjs.js",
                format: "cjs",
                sourcemap: true
            },
            plugins: [
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
                file: "./dist/core.es.js",
                format: "es",
                sourcemap: true
            },
            plugins: [
                // has to be before typescript plugin
                nodeResolve({ browser: true }),
                typescript(typescriptOptions), //needed for correct order
                commonjs()
            ]
        }
    ];
};
