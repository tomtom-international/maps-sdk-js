import path from "path";
import dotenv from "dotenv";

dotenv.config({ path: path.resolve("../test-env-config/.env") });

/** @type {import('ts-jest/dist/types').InitialOptionsTsJest} */
module.exports = {
    testTimeout: 10000,
    preset: "ts-jest",
    testEnvironment: "node",
    extensionsToTreatAsEsm: [".ts"],
    testPathIgnorePatterns: ["<rootDir>/dist/", "<rootDir>/node_modules/", "<rootDir>/.rollup.cache/"],
    moduleNameMapper: {
        "@anw/go-sdk-js/core": "core"
    }
};
