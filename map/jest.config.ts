import type { Config } from "jest";

const config: Config = {
    testTimeout: 10000,
    preset: "ts-jest",
    testEnvironment: "node",
    extensionsToTreatAsEsm: [".ts"],
    testPathIgnorePatterns: ["<rootDir>/dist/", "<rootDir>/node_modules/", "<rootDir>/.rollup.cache/"],
    moduleNameMapper: {
        "@anw/go-sdk-js/core": "core"
    }
};

export default config;
