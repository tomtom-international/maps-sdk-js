// examples/map-data-agent/e2e-tests/eval/eval-cases.ts
import { expect } from '@playwright/test';
import type { EvalGlobalThis } from '@testing/ai-eval';
import { defineEvalCases } from '@testing/ai-eval';

export const cases = defineEvalCases([
    {
        id: 'coverage-analysis-basic',
        messages: [
            'Load service center data from /data/service-centers.json and show the 30-minute coverage for each center.',
        ],
        assertions: {
            toolsCalled: ['loadCoverageSites', 'showCoverageAnalysis'],
            maxTools: 4,
        },
        runs: 3,
        mapAssert: async (page) => {
            const coverageComplete = await page.evaluate(async () => {
                const evalWindow = globalThis as EvalGlobalThis & {
                    getAnalysisServices?: () => { coverageAnalysisComplete: boolean; coverageSummary: string };
                };
                return evalWindow.getAnalysisServices?.()?.coverageAnalysisComplete ?? false;
            });
            expect(coverageComplete).toBe(true);

            const geometriesModule = await page.evaluate(async () => {
                const evalWindow = globalThis as EvalGlobalThis;
                const module = await evalWindow.getGeometriesModule?.();
                if (!module) throw new Error('getGeometriesModule not available');
                const shown = module.getShown();
                return { featureCount: shown?.geometry?.features?.length ?? 0 };
            });
            expect(geometriesModule.featureCount).toBeGreaterThan(0);
        },
        screenshot: { enabled: true, assertScreenshot: false },
    },
]);
