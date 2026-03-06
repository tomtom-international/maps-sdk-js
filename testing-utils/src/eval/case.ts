import type { Page } from '@playwright/test';

/**
 * Defines one eval scenario executed by `runEvalSuite()`.
 */
export type EvalCase = {
    /** Stable case identifier used in test names, reports, and screenshot filenames. */
    id: string;
    /** Ordered user messages that make up the full conversation for this eval case. */
    messages: string[];
    /** Optional number of repeated runs for this case. Defaults to the suite-level standard. */
    runs?: number;
    /** Optional minimum pass rate required across repeated runs. */
    passThreshold?: number;
    /** Deterministic assertions evaluated against accumulated telemetry for the whole conversation. */
    assertions: {
        /** Tool names that must appear at least once across all turns in the case. */
        toolsCalled: string[];
        /** Tool names that must never appear during the case. */
        toolsNotCalled?: string[];
        /** Maximum allowed total step count accumulated across all turns. */
        maxSteps?: number;
    };
    /** Optional map-level assertion executed after all messages have completed. */
    mapAssert?: (page: Page) => Promise<void>;
    /** Optional screenshot behavior for the final map state. */
    screenshot?: {
        /** Whether a final map screenshot should be captured for this case. */
        enabled: boolean;
        /** Whether the captured screenshot should be asserted against a checked-in baseline snapshot. */
        assertScreenshot: boolean;
        /** Optional Playwright snapshot diff tolerance used when asserting screenshots. */
        maxDiffPixelRatio?: number;
        /** Optional delay after completion before taking the final screenshot. */
        waitAfterCompletion?: number;
    };
};
