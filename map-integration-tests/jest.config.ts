import dotenv from "dotenv";

dotenv.config({ path: "../test-env-config/.env" });

module.exports = {
    preset: "jest-puppeteer",
    extensionsToTreatAsEsm: [".ts"],
    transform: {
        "^.+\\.ts?$": "ts-jest"
    },
    testPathIgnorePatterns: ["<rootDir>/node_modules/"]
};
