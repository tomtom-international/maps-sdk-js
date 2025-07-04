import type { Config } from 'jest';

const config: Config = {
    testTimeout: 10000,
    preset: 'ts-jest',
    testEnvironment: 'node',
    extensionsToTreatAsEsm: ['.ts'],
    testPathIgnorePatterns: ['<rootDir>/dist/', '<rootDir>/node_modules/', '<rootDir>/.rollup.cache/'],
    moduleNameMapper: {
        '@anw/maps-sdk-js/core': 'core',
        '^lodash-es$': 'lodash', // Jest doesn't have strong ES modules compatibility
    },
    setupFilesAfterEnv: ['./jest.globalSetup.js'],
    transform: {
        '\\.ts$': 'ts-jest',
        '\\.(jpg|jpeg|png|gif|eot|otf|webp|svg|ttf|woff|woff2|mp4|webm|wav|mp3|m4a|aac|oga)$':
            './jest.fileTransformer.js',
    },
};

export default config;
