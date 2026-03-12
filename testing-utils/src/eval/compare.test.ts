import { describe, expect, it } from 'vitest';
import { buildEvalCaseComparisonRows, parseEvalReport } from './index';
import type { EvalLoadedReport, EvalReport } from './report';

const createReport = (overrides: Partial<EvalReport> = {}): EvalReport => ({
    generatedAt: '2026-03-10T10:00:00.000Z',
    totalCases: 2,
    totalRuns: 10,
    belowThresholdCases: ['case-b'],
    totals: {
        totalTokens: 1000,
        totalWallClockMs: 4000,
    },
    cases: [
        {
            caseId: 'case-a',
            totalRuns: 5,
            passCount: 5,
            passRate: 1,
            passThreshold: 0.8,
            belowThreshold: false,
            tokens: {
                input: { min: 10, max: 14, mean: 12, median: 12 },
                output: { min: 4, max: 6, mean: 5, median: 5 },
                total: { min: 14, max: 20, mean: 17, median: 17 },
            },
            steps: { min: 2, max: 4, mean: 3, median: 3 },
            wallClockMs: { min: 1000, max: 1300, mean: 1150, median: 1150 },
            tooling: { expectedSequence: ['geocode'], perRun: [] },
            classification: { groups: [['standard']], timeMs: { min: 0, max: 0, mean: 0, median: 0 } },
            screenshots: { failures: 0, matches: 5 },
        },
        {
            caseId: 'case-b',
            totalRuns: 5,
            passCount: 2,
            passRate: 0.4,
            passThreshold: 0.8,
            belowThreshold: true,
            tokens: {
                input: { min: 20, max: 22, mean: 21, median: 21 },
                output: { min: 8, max: 10, mean: 9, median: 9 },
                total: { min: 28, max: 32, mean: 30, median: 30 },
            },
            steps: { min: 4, max: 6, mean: 5, median: 5 },
            wallClockMs: { min: 2000, max: 2600, mean: 2200, median: 2200 },
            tooling: { expectedSequence: ['showRoute'], perRun: [] },
            classification: { groups: [['complex']], timeMs: { min: 0, max: 0, mean: 0, median: 0 } },
            screenshots: { failures: 2, matches: 3 },
        },
    ],
    ...overrides,
});

describe('parseEvalReport', () => {
    it('parses a valid aggregated report', () => {
        const report = parseEvalReport(createReport(), 'fixture');

        expect(report.totalCases).toBe(2);
        expect(report.cases[0]?.caseId).toBe('case-a');
        expect(report.cases[1]?.belowThreshold).toBe(true);
    });

    it('parses run-level tool diagnostics when present', () => {
        const report = parseEvalReport(
            createReport({
                cases: [
                    {
                        ...createReport().cases[0],
                        tooling: {
                            expectedSequence: ['geocode', 'calculateRoute', 'showRoute'],
                            perRun: [
                                {
                                    runIndex: 1,
                                    passed: false,
                                    actualSequence: ['geocode', 'geocode', 'geocode', 'showRoute'],
                                    forbiddenViolations: [
                                        {
                                            toolName: 'clearMap',
                                            firstStepIndex: 3,
                                            snippet: [
                                                { stepIndex: 2, toolNames: ['geocode'] },
                                                { stepIndex: 3, toolNames: ['clearMap'] },
                                            ],
                                        },
                                    ],
                                },
                            ],
                        },
                    },
                    createReport().cases[1],
                ],
            }),
            'fixture-with-runs',
        );

        expect(report.cases[0]?.tooling.perRun[0]?.actualSequence[1]).toBe('geocode');
        expect(report.cases[0]?.tooling.expectedSequence[1]).toBe('calculateRoute');
        expect(report.cases[0]?.tooling.perRun[0]?.forbiddenViolations[0]?.toolName).toBe('clearMap');
    });

    it('throws on an invalid report shape', () => {
        expect(() => parseEvalReport({ generatedAt: '2026-03-10T10:00:00.000Z' }, 'broken')).toThrow(
            'broken is missing top-level summary fields.',
        );
    });
});

describe('buildEvalCaseComparisonRows', () => {
    it('computes deltas and missing cases against a baseline', () => {
        const baseline: EvalLoadedReport = {
            id: 'baseline',
            label: 'Baseline',
            source: 'baseline.json',
            report: createReport(),
        };

        const candidate: EvalLoadedReport = {
            id: 'candidate',
            label: 'Candidate',
            source: 'candidate.json',
            report: createReport({
                totalCases: 2,
                belowThresholdCases: [],
                cases: [
                    {
                        ...createReport().cases[0],
                        passRate: 0.8,
                        passCount: 4,
                        tokens: {
                            ...createReport().cases[0].tokens,
                            total: { min: 14, max: 24, mean: 19, median: 19 },
                        },
                    },
                ],
            }),
        };

        const rows = buildEvalCaseComparisonRows([baseline, candidate], 'baseline');
        const caseA = rows.find((row) => row.caseId === 'case-a');
        const caseB = rows.find((row) => row.caseId === 'case-b');

        expect(caseA?.entries[1]?.deltaFromBaseline?.passRate).toBeCloseTo(-0.2);
        expect(caseA?.entries[1]?.deltaFromBaseline?.totalTokensMean).toBe(2);
        expect(caseA?.regressionCount).toBe(1);
        expect(caseB?.missingCount).toBe(1);
    });

    it('classifies below-threshold transitions in one direction only', () => {
        const baseline: EvalLoadedReport = {
            id: 'baseline',
            label: 'Baseline',
            source: 'baseline.json',
            report: createReport(),
        };

        const candidate: EvalLoadedReport = {
            id: 'candidate',
            label: 'Candidate',
            source: 'candidate.json',
            report: createReport({
                belowThresholdCases: ['case-a'],
                cases: [
                    {
                        ...createReport().cases[0],
                        passRate: 0.6,
                        passCount: 3,
                        belowThreshold: true,
                    },
                    {
                        ...createReport().cases[1],
                        passRate: 0.8,
                        passCount: 4,
                        belowThreshold: false,
                    },
                ],
            }),
        };

        const rows = buildEvalCaseComparisonRows([baseline, candidate], 'baseline');
        const caseA = rows.find((row) => row.caseId === 'case-a');
        const caseB = rows.find((row) => row.caseId === 'case-b');

        expect(caseA?.entries[1]?.deltaFromBaseline?.becameBelowThreshold).toBe(true);
        expect(caseA?.entries[1]?.deltaFromBaseline?.becameWithinThreshold).toBe(false);
        expect(caseA?.regressionCount).toBe(1);
        expect(caseA?.improvementCount).toBe(0);

        expect(caseB?.entries[1]?.deltaFromBaseline?.becameBelowThreshold).toBe(false);
        expect(caseB?.entries[1]?.deltaFromBaseline?.becameWithinThreshold).toBe(true);
        expect(caseB?.regressionCount).toBe(0);
        expect(caseB?.improvementCount).toBe(1);
    });
});
