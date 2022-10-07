import dotenv from "dotenv";

dotenv.config({ path: "../test-env-config/.env" });

module.exports = {
    testTimeout: 15000,
    preset: "jest-puppeteer",
    extensionsToTreatAsEsm: [".ts"],
    transform: {
        "^.+\\.ts?$": "ts-jest"
    },
    testPathIgnorePatterns: ["<rootDir>/node_modules/"]
};
