import commonjs from "@rollup/plugin-commonjs";
import { nodeResolve } from "@rollup/plugin-node-resolve";
import typescript from "@rollup/plugin-typescript";
import { terser } from "rollup-plugin-terser";

export default () => {
    const plugins = [
        // has to be before typescript plugin
        nodeResolve({ browser: true }),
        typescript(),
        commonjs(),
        terser()
    ];

    return [
        {
            input: "core/src/index.ts",
            output: {
                file: "core/dist/core.prod.js",
                format: "es",
                sourcemap: true
            },
            plugins
        },
        {
            input: "services/src/index.ts",
            output: {
                file: "services/dist/services.prod.js",
                format: "es",
                sourcemap: true
            },
            plugins
        },
        {
            input: "map/src/index.ts",
            output: {
                file: "map/dist/map.prod.js",
                format: "es",
                sourcemap: true
            },
            plugins
        }
    ];
};
