import type { Config } from 'jest';

const config: Config = {
    preset: 'ts-jest',
    testEnvironment: 'node',
    extensionsToTreatAsEsm: ['.ts'],
    moduleNameMapper: { '^lodash-es$': 'lodash' }, // Jest doesn't have strong ES modules compatibility
    testPathIgnorePatterns: ['<rootDir>/dist/', '<rootDir>/node_modules/', '<rootDir>/.rollup.cache/'],
};

export default config;
