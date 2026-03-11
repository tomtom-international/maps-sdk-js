import { describe, expect, it } from 'vitest';
import {
    analyzeToolCallSequence,
    analyzeToolSequence,
    getForbiddenToolViolations,
    getToolCallCounts,
    getToolCallCountsFromSequence,
    getToolCallSequence,
    getToolFrequencySummary,
    getToolFrequencySummaryFromSequences,
} from './tool-calls';
import type { EvalTelemetry } from './types';

const createTelemetry = (toolNames: string[]): EvalTelemetry => ({
    completed: true,
    error: null,
    userMessages: [],
    steps: toolNames.map((toolName, index) => ({
        index: index + 1,
        toolCalls: [{ name: toolName, input: null, output: null }],
        usage: {
            inputTokens: 0,
            outputTokens: 0,
            totalTokens: 0,
        },
    })),
    totalUsage: {
        inputTokens: 0,
        outputTokens: 0,
        totalTokens: 0,
    },
    classification: null,
    agentText: '',
    wallClockMs: 0,
});

describe('getToolCallSequence', () => {
    it('preserves order and duplicate tool calls', () => {
        const telemetry = createTelemetry(['geocode', 'calculateRoute', 'showRoute', 'showRoute']);

        expect(getToolCallSequence(telemetry)).toEqual(['geocode', 'calculateRoute', 'showRoute', 'showRoute']);
    });
});

describe('getToolFrequencySummary', () => {
    it('counts total invocations separately from run coverage', () => {
        const summary = getToolFrequencySummary([
            createTelemetry(['geocode', 'calculateRoute', 'showRoute', 'showRoute', 'addStopToRoute']),
        ]);

        expect(summary).toEqual([
            { toolName: 'geocode', totalCalls: 1, runsWithTool: 1 },
            { toolName: 'calculateRoute', totalCalls: 1, runsWithTool: 1 },
            { toolName: 'showRoute', totalCalls: 2, runsWithTool: 1 },
            { toolName: 'addStopToRoute', totalCalls: 1, runsWithTool: 1 },
        ]);
    });

    it('tracks run coverage across multiple runs', () => {
        const summary = getToolFrequencySummary([
            createTelemetry(['showRoute', 'showRoute']),
            createTelemetry(['showRoute']),
            createTelemetry(['geocode']),
        ]);

        expect(summary).toEqual([
            { toolName: 'showRoute', totalCalls: 3, runsWithTool: 2 },
            { toolName: 'geocode', totalCalls: 1, runsWithTool: 1 },
        ]);
    });
});

describe('getToolFrequencySummaryFromSequences', () => {
    it('builds case-level frequency from stored sequences', () => {
        const summary = getToolFrequencySummaryFromSequences([['showRoute', 'showRoute'], ['showRoute'], ['geocode']]);

        expect(summary).toEqual([
            { toolName: 'showRoute', totalCalls: 3, runsWithTool: 2 },
            { toolName: 'geocode', totalCalls: 1, runsWithTool: 1 },
        ]);
    });
});

describe('getToolCallCounts', () => {
    it('counts tool calls per run preserving first-seen order', () => {
        const telemetry = createTelemetry(['geocode', 'calculateRoute', 'geocode', 'showRoute']);

        expect(getToolCallCounts(telemetry)).toEqual([
            { toolName: 'geocode', count: 2 },
            { toolName: 'calculateRoute', count: 1 },
            { toolName: 'showRoute', count: 1 },
        ]);
    });
});

describe('getToolCallCountsFromSequence', () => {
    it('counts stored sequences without telemetry', () => {
        expect(getToolCallCountsFromSequence(['geocode', 'calculateRoute', 'geocode', 'showRoute'])).toEqual([
            { toolName: 'geocode', count: 2 },
            { toolName: 'calculateRoute', count: 1 },
            { toolName: 'showRoute', count: 1 },
        ]);
    });
});

describe('analyzeToolSequence', () => {
    it('reports missing and structurally unexpected tools', () => {
        const telemetry = createTelemetry(['geocode', 'searchPlaces', 'showRoute']);

        expect(analyzeToolSequence(telemetry, ['geocode', 'calculateRoute', 'showRoute'])).toEqual({
            sequenceMatched: false,
            actualSequence: ['geocode', 'searchPlaces', 'showRoute'],
            missingTools: ['calculateRoute'],
            unexpectedTools: ['showRoute', 'searchPlaces'],
            structurallyUnexpectedTools: ['searchPlaces'],
            positionallyUnexpectedTools: ['showRoute'],
            firstDivergenceIndex: 2,
            firstDivergenceExpectedTool: 'calculateRoute',
            firstDivergenceActualTool: 'searchPlaces',
            firstDivergenceStepIndex: 2,
        });
    });

    it('reports positionally unexpected tools when counts are otherwise valid', () => {
        const telemetry = createTelemetry(['geocode', 'showRoute', 'calculateRoute']);

        expect(analyzeToolSequence(telemetry, ['geocode', 'calculateRoute', 'showRoute'])).toEqual({
            sequenceMatched: false,
            actualSequence: ['geocode', 'showRoute', 'calculateRoute'],
            missingTools: [],
            unexpectedTools: ['showRoute'],
            structurallyUnexpectedTools: [],
            positionallyUnexpectedTools: ['showRoute'],
            firstDivergenceIndex: 2,
            firstDivergenceExpectedTool: 'calculateRoute',
            firstDivergenceActualTool: 'showRoute',
            firstDivergenceStepIndex: 2,
        });
    });
});

describe('analyzeToolCallSequence', () => {
    it('derives assertion diagnostics from stored sequences', () => {
        expect(
            analyzeToolCallSequence(
                ['geocode', 'showRoute', 'calculateRoute'],
                ['geocode', 'calculateRoute', 'showRoute'],
            ),
        ).toEqual({
            sequenceMatched: false,
            actualSequence: ['geocode', 'showRoute', 'calculateRoute'],
            missingTools: [],
            unexpectedTools: ['showRoute'],
            structurallyUnexpectedTools: [],
            positionallyUnexpectedTools: ['showRoute'],
            firstDivergenceIndex: 2,
            firstDivergenceExpectedTool: 'calculateRoute',
            firstDivergenceActualTool: 'showRoute',
            firstDivergenceStepIndex: null,
        });
    });
});

describe('getForbiddenToolViolations', () => {
    it('captures the first violating step and nearby snippet', () => {
        const telemetry = createTelemetry(['geocode', 'clearMap', 'showRoute', 'searchPlaces']);

        expect(getForbiddenToolViolations(telemetry, ['clearMap', 'togglePOIs'])).toEqual([
            {
                toolName: 'clearMap',
                firstStepIndex: 2,
                snippet: [
                    { stepIndex: 1, toolNames: ['geocode'] },
                    { stepIndex: 2, toolNames: ['clearMap'] },
                    { stepIndex: 3, toolNames: ['showRoute'] },
                ],
            },
        ]);
    });
});
