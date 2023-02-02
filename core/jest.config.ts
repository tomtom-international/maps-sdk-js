import jestBaseConfig from "../test-config/jest.config.base";

/** @type {import('ts-jest/dist/types').InitialOptionsTsJest} */
module.exports = {
    ...jestBaseConfig,
    preset: "ts-jest",
    testEnvironment: "node",
    extensionsToTreatAsEsm: [".ts"],
    testPathIgnorePatterns: ["<rootDir>/dist/", "<rootDir>/node_modules/", "<rootDir>/.rollup.cache/"]
};
