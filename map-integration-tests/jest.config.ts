import type { Config } from "jest";
import dotenv from "dotenv";

dotenv.config({ path: "../test-config/.env" });

const config: Config = {
    testTimeout: 100000,
    preset: "jest-puppeteer",
    extensionsToTreatAsEsm: [".ts"],
    transform: { "^.+\\.ts?$": "ts-jest" },
    testPathIgnorePatterns: ["<rootDir>/node_modules/"],
    moduleNameMapper: { "@anw/maps-sdk-js/core": "<rootDir>/../core/dist/core.cjs.min.js" },
    setupFilesAfterEnv: ["./jest.globalSetup.js"]
};

export default config;
