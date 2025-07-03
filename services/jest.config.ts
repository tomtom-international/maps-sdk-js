import dotenv from 'dotenv';
import type { Config } from 'jest';
import path from 'path';

dotenv.config({ path: path.resolve('../test-config/.env') });

const config: Config = {
    testTimeout: 10000,
    preset: 'ts-jest',
    extensionsToTreatAsEsm: ['.ts'],
    testPathIgnorePatterns: ['<rootDir>/dist/', '<rootDir>/node_modules/', '<rootDir>/.rollup.cache/'],
    moduleNameMapper: {
        '@anw/maps-sdk-js/core': 'core',
    },
};

export default config;
