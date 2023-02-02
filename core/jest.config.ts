import type { Config } from "jest";

const config: Config = {
    preset: "ts-jest",
    testEnvironment: "node",
    extensionsToTreatAsEsm: [".ts"],
    setupFiles: ["<rootDir>/../test-config/setupFile.js"],
    moduleNameMapper: {
        uuid: require.resolve("uuid")
    },
    testPathIgnorePatterns: ["<rootDir>/dist/", "<rootDir>/node_modules/", "<rootDir>/.rollup.cache/"]
};

export default config;
