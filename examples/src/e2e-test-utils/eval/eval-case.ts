import type { Page } from '@playwright/test';

export type EvalCase = {
    id: string;
    query: string;
    runs?: number;
    passThreshold?: number;
    assertions: {
        toolsCalled: string[];
        toolsNotCalled?: string[];
        maxSteps?: number;
    };
    mapAssert?: (page: Page) => Promise<void>;
    screenshot?: {
        enabled: boolean;
        goldenComparison: boolean;
        maxDiffPixelRatio?: number;
        waitAfterCompletion?: number;
    };
};
