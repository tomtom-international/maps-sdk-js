import { expect, test } from '@playwright/test';
import { waitForMapIdle } from '../map-queries';
import type { EvalCase } from './case';
import { getToolCallSequence } from './tool-calls';
import type { EvalGlobalThis, EvalTelemetry } from './types';

type RunEvalSuiteOptions = {
    baseUrl: string;
    mapSelector?: string;
    completionTimeout?: number;
};

const DEFAULT_RUNS = 5;
const DEFAULT_THRESHOLD = 0.8;

const mergeTelemetry = (telemetries: EvalTelemetry[]): EvalTelemetry => {
    const mergedSteps: EvalTelemetry['steps'] = [];

    for (const telemetry of telemetries) {
        for (const step of telemetry.steps) {
            mergedSteps.push({
                ...step,
                index: mergedSteps.length + 1,
            });
        }
    }

    return {
        completed: true,
        error: telemetries.find((telemetry) => telemetry.error)?.error ?? null,
        userMessages: telemetries.flatMap((telemetry) => telemetry.userMessages),
        steps: mergedSteps,
        totalUsage: telemetries.reduce(
            (usage, telemetry) => ({
                inputTokens: usage.inputTokens + telemetry.totalUsage.inputTokens,
                outputTokens: usage.outputTokens + telemetry.totalUsage.outputTokens,
                totalTokens: usage.totalTokens + telemetry.totalUsage.totalTokens,
            }),
            {
                inputTokens: 0,
                outputTokens: 0,
                totalTokens: 0,
            },
        ),
        classification: telemetries.at(-1)?.classification ?? null,
        agentText: telemetries.at(-1)?.agentText ?? '',
        wallClockMs: telemetries.reduce((sum, telemetry) => sum + telemetry.wallClockMs, 0),
    };
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
                            const evalWindow = globalThis as EvalGlobalThis;
                            if (!evalWindow.__evalReset) {
                                throw new Error('window.__evalReset is not available.');
                            }
                            evalWindow.__evalReset();
                        });

                        const turnTelemetries: EvalTelemetry[] = [];

                        for (const message of evalCase.messages) {
                            await page.evaluate((input) => {
                                const evalWindow = globalThis as EvalGlobalThis;
                                if (!evalWindow.__evalSendMessage) {
                                    throw new Error('window.__evalSendMessage is not available.');
                                }
                                evalWindow.__evalSendMessage(input);
                            }, message);

                            await page.waitForFunction(
                                () => {
                                    const evalWindow = globalThis as EvalGlobalThis;
                                    return evalWindow.__evalTelemetry?.completed === true;
                                },
                                { timeout: completionTimeout },
                            );

                            const turnTelemetry = await page.evaluate(() => {
                                const evalWindow = globalThis as EvalGlobalThis;
                                return evalWindow.__evalTelemetry;
                            });

                            if (!turnTelemetry) {
                                throw new Error('window.__evalTelemetry was not captured.');
                            }

                            turnTelemetries.push(turnTelemetry);
                        }

                        const telemetry = mergeTelemetry(turnTelemetries);

                        await testInfo.attach('eval-meta', {
                            body: JSON.stringify({
                                caseId: evalCase.id,
                                runIndex: runIndex + 1,
                                passThreshold,
                                expectedTools: evalCase.assertions.toolsCalled,
                                forbiddenTools: evalCase.assertions.toolsNotCalled ?? [],
                            }),
                            contentType: 'application/json',
                        });

                        await testInfo.attach('telemetry', {
                            body: JSON.stringify(telemetry),
                            contentType: 'application/json',
                        });

                        expect(telemetry.error).toBeNull();

                        const calledTools = getToolCallSequence(telemetry);

                        expect(calledTools).toEqual(evalCase.assertions.toolsCalled);

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
                            if (evalCase.screenshot.assertScreenshot) {
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
