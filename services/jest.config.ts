import path from "path";
import dotenv from "dotenv";
import type { Config } from "jest";

dotenv.config({ path: path.resolve("../test-config/.env") });

const config: Config = {
    testTimeout: 10000,
    preset: "ts-jest",
    testEnvironment: "node",
    extensionsToTreatAsEsm: [".ts"],
    setupFiles: ["<rootDir>/../test-config/setupFile.js"],
    testPathIgnorePatterns: ["<rootDir>/dist/", "<rootDir>/node_modules/", "<rootDir>/.rollup.cache/"],
    moduleNameMapper: {
        "@anw/go-sdk-js/core": "core"
    }
};

export default config;
