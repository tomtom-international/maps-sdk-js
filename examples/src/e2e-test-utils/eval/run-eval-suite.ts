import { expect, test } from '@playwright/test';
import type { EvalCase } from './eval-case';
import { waitForMapIdle } from './map-queries';
import type { EvalTelemetry } from './types';

type RunEvalSuiteOptions = {
    baseUrl: string;
    mapSelector?: string;
    completionTimeout?: number;
};

const DEFAULT_RUNS = 5;
const DEFAULT_THRESHOLD = 0.8;

const getCalledTools = (telemetry: EvalTelemetry): string[] => {
    const tools = telemetry.steps.flatMap((step) => step.toolCalls.map((toolCall) => toolCall.name));
    return [...new Set(tools)];
};

export const runEvalSuite = (cases: EvalCase[], options: RunEvalSuiteOptions): void => {
    const mapSelector = options.mapSelector ?? '#sdk-map';
    const completionTimeout = options.completionTimeout ?? 120_000;

    test.describe('agent-eval', () => {
        for (const evalCase of cases) {
            const runs = evalCase.runs ?? DEFAULT_RUNS;
            const passThreshold = evalCase.passThreshold ?? DEFAULT_THRESHOLD;

            test.describe(evalCase.id, () => {
                for (let runIndex = 0; runIndex < runs; runIndex += 1) {
                    test(`run-${runIndex + 1}`, async ({ page }, testInfo) => {
                        await page.goto(options.baseUrl);
                        await page.waitForSelector(mapSelector, { timeout: completionTimeout });
                        await waitForMapIdle(page);

                        await page.evaluate(() => {
                            const evalWindow = globalThis as unknown as { __evalReset?: () => void };
                            if (!evalWindow.__evalReset) {
                                throw new Error('window.__evalReset is not available.');
                            }
                            evalWindow.__evalReset();
                        });

                        await page.evaluate((query) => {
                            const evalWindow = globalThis as unknown as {
                                __evalSendMessage?: (input: string) => void;
                            };
                            if (!evalWindow.__evalSendMessage) {
                                throw new Error('window.__evalSendMessage is not available.');
                            }
                            evalWindow.__evalSendMessage(query);
                        }, evalCase.query);

                        await page.waitForFunction(
                            () => {
                                const evalWindow = globalThis as unknown as {
                                    __evalTelemetry?: { completed?: boolean };
                                };
                                return evalWindow.__evalTelemetry?.completed === true;
                            },
                            { timeout: completionTimeout },
                        );

                        const telemetry = await page.evaluate(() => {
                            const evalWindow = globalThis as unknown as { __evalTelemetry?: EvalTelemetry };
                            return evalWindow.__evalTelemetry;
                        });

                        if (!telemetry) {
                            throw new Error('window.__evalTelemetry was not captured.');
                        }

                        await testInfo.attach('eval-meta', {
                            body: JSON.stringify({
                                caseId: evalCase.id,
                                runIndex: runIndex + 1,
                                passThreshold,
                            }),
                            contentType: 'application/json',
                        });

                        await testInfo.attach('telemetry', {
                            body: JSON.stringify(telemetry),
                            contentType: 'application/json',
                        });

                        expect(telemetry.error).toBeNull();

                        const calledTools = getCalledTools(telemetry);

                        for (const requiredTool of evalCase.assertions.toolsCalled) {
                            expect(calledTools).toContain(requiredTool);
                        }

                        for (const forbiddenTool of evalCase.assertions.toolsNotCalled ?? []) {
                            expect(calledTools).not.toContain(forbiddenTool);
                        }

                        if (typeof evalCase.assertions.maxSteps === 'number') {
                            expect(telemetry.steps.length).toBeLessThanOrEqual(evalCase.assertions.maxSteps);
                        }

                        await waitForMapIdle(page);
                        if (evalCase.mapAssert) {
                            await evalCase.mapAssert(page);
                        }

                        if (evalCase.screenshot?.enabled) {
                            const waitAfterCompletion = evalCase.screenshot.waitAfterCompletion ?? 2000;
                            await page.waitForTimeout(waitAfterCompletion);

                            const screenshot = await page.locator(mapSelector).screenshot();
                            if (evalCase.screenshot.goldenComparison) {
                                await expect(screenshot).toMatchSnapshot(`${evalCase.id}.png`, {
                                    maxDiffPixelRatio: evalCase.screenshot.maxDiffPixelRatio ?? 0.2,
                                });
                            } else {
                                await testInfo.attach(`map-${evalCase.id}-run-${runIndex + 1}`, {
                                    body: screenshot,
                                    contentType: 'image/png',
                                });
                            }
                        }
                    });
                }
            });
        }
    });
};
