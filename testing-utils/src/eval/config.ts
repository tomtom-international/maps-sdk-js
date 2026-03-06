import type { PlaywrightTestConfig } from '@playwright/test';

type PlaywrightConfigBuilder = (overrides: Partial<PlaywrightTestConfig>) => PlaywrightTestConfig;

export const buildEvalPlaywrightConfig = (
    buildPlaywrightConfig: PlaywrightConfigBuilder,
    overrides: Partial<PlaywrightTestConfig> = {},
): PlaywrightTestConfig => {
    return buildPlaywrightConfig({
        testMatch: '**/eval/**/*.test.ts',
        timeout: 180_000,
        retries: 0,
        workers: 5,
        fullyParallel: true,
        use: {
            headless: true,
            screenshot: 'off',
            trace: 'on-first-retry',
        },
        ...overrides,
    });
};
