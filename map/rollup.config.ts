import commonjs from "@rollup/plugin-commonjs";
import { nodeResolve } from "@rollup/plugin-node-resolve";
import typescript from "@rollup/plugin-typescript";
import terser from "@rollup/plugin-terser";
import analyze from "rollup-plugin-analyzer";
import image from "@rollup/plugin-image";
// @ts-ignore
import includePaths from "rollup-plugin-includepaths";

const includePathOptions = {
    include: {},
    paths: [],
    external: ["@anw/maps-sdk-js/core", "maplibre-gl"],
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
                file: "./dist/map.cjs.min.js",
                format: "cjs",
                sourcemap: true
            },
            plugins: [
                // has to be before typescript plugin
                includePaths(includePathOptions),
                nodeResolve({ browser: true }),
                typescript(typescriptOptions), //needed for correct order
                commonjs(),
                terser(),
                image()
            ]
        },
        {
            input: "./index.ts",
            watch: {
                include: "./**",
                clearScreen: false
            },
            output: {
                file: "./dist/map.cjs.js",
                format: "cjs",
                sourcemap: true
            },
            plugins: [
                // has to be before typescript plugin
                includePaths(includePathOptions),
                nodeResolve({ browser: true }),
                typescript(typescriptOptions), //needed for correct order
                commonjs(),
                image()
            ]
        },
        {
            input: "./index.ts",
            watch: {
                include: "./**",
                clearScreen: false
            },
            output: {
                file: "./dist/map.es.js",
                format: "es",
                sourcemap: true
            },
            plugins: [
                // has to be before typescript plugin
                includePaths(includePathOptions),
                nodeResolve({ browser: true }),
                typescript(typescriptOptions), //needed for correct order
                commonjs(),
                image(),
                analyze({ summaryOnly: true, limit: 10 })
            ]
        }
    ];
};
