import type { PlaywrightTestConfig } from '@playwright/test';
import { buildPlaywrightConfig } from '../../../playwright.config';

export const buildEvalPlaywrightConfig = (overrides: Partial<PlaywrightTestConfig> = {}): PlaywrightTestConfig => {
    return buildPlaywrightConfig({
        testMatch: '**/eval/**/*.test.ts',
        timeout: 180_000,
        retries: 0,
        workers: 3,
        fullyParallel: true,
        use: {
            headless: true,
            screenshot: 'off',
            trace: 'on-first-retry',
        },
        ...overrides,
    });
};
