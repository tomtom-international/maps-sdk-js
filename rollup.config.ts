import { nodeResolve } from "@rollup/plugin-node-resolve";
import typescript from "@rollup/plugin-typescript";

export default () => {
    return [
        {
            input: "core/src/index.ts",
            output: {
                file: "core/dist/core.prod.js",
                format: "es"
            },
            plugins: [typescript()]
        },
        {
            input: "services/src/index.ts",
            output: {
                file: "services/dist/services.prod.js",
                format: "es"
            },
            plugins: [typescript()]
        },
        {
            input: "map/src/index.ts",
            output: {
                file: "map/dist/map.prod.js",
                format: "es"
            },
            plugins: [typescript()]
        }
    ];
};
