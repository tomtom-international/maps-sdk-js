import commonjs from "@rollup/plugin-commonjs";
import { nodeResolve } from "@rollup/plugin-node-resolve";
import typescript from "@rollup/plugin-typescript";
import { terser } from "rollup-plugin-terser";

export default () => {
    const plugins = [
        // has to be before typescript plugin
        nodeResolve({ browser: true }),
        typescript({ tsconfig: "./tsconfig.json", outputToFilesystem: true }), //needed for correct order
        commonjs(),
        terser()
    ];

    return [
        {
            input: "./src/index.ts",
            watch: {
                include: './src/**',
                clearScreen: false
            },
            output: {
                file: "./dist/core.prod.js",
                format: "es",
                sourcemap: true
            },
            plugins
        }
    ];
};
