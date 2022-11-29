import dotenv from "dotenv";

dotenv.config({ path: "../test-env-config/.env" });

module.exports = {
    testTimeout: 40000,
    preset: "jest-puppeteer",
    extensionsToTreatAsEsm: [".ts"],
    transform: {
        "^.+\\.ts?$": "ts-jest"
    },
    testPathIgnorePatterns: ["<rootDir>/node_modules/"],
    moduleFileExtensions: ["js", "jsx", "ts"],
    moduleNameMapper: {
        "@anw/go-sdk-js/core": "<rootDir>/../core/dist/core.cjs.min.js"
    }
};
