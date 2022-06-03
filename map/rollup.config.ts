import commonjs from "@rollup/plugin-commonjs";
import { nodeResolve } from "@rollup/plugin-node-resolve";
import typescript from "@rollup/plugin-typescript";
import { terser } from "rollup-plugin-terser";

export default () => {
    return [
        {
            input: "./src/index.ts",
            output: {
                file: "./dist/map.cjs.min.js",
                format: "cjs",
                sourcemap: true
            },
            plugins: [
                // has to be before typescript plugin
                nodeResolve({ browser: true }),
                typescript({ tsconfig: "./tsconfig.json", outputToFilesystem: true }), //needed for correct order
                commonjs(),
                terser()
            ]
        },
        {
            input: "./src/index.ts",
            watch: {
                include: './src/**',
                clearScreen: false
            },
            output: {
                file: "./dist/map.cjs.js",
                format: "cjs",
                sourcemap: true
            },
            plugins: [
                // has to be before typescript plugin
                nodeResolve({ browser: true }),
                typescript({ tsconfig: "./tsconfig.json", outputToFilesystem: true }), //needed for correct order
                commonjs()
            ]
        },
        {
            input: "./src/index.ts",
            watch: {
                include: './src/**',
                clearScreen: false
            },
            output: {
                file: "./dist/map.es.js",
                format: "es",
                sourcemap: true
            },
            plugins: [
                // has to be before typescript plugin
                nodeResolve({ browser: true }),
                typescript({ tsconfig: "./tsconfig.json", outputToFilesystem: true }), //needed for correct order
                commonjs()
            ]
        }
    ];
};
