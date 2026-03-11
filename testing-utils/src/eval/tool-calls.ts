import type { EvalTelemetry } from './types';

type EvalFlattenedToolCall = {
    toolName: string;
    stepIndex: number | null;
};

export const getToolCallSequence = (telemetry: EvalTelemetry): string[] =>
    telemetry.steps.flatMap((step) => step.toolCalls.map((toolCall) => toolCall.name));

export const getToolCallCountsFromSequence = (toolNames: string[]): Array<{ toolName: string; count: number }> => {
    const counts = new Map<string, number>();

    for (const toolName of toolNames) {
        counts.set(toolName, (counts.get(toolName) ?? 0) + 1);
    }

    return Array.from(counts.entries()).map(([toolName, count]) => ({ toolName, count }));
};

export const getToolCallCounts = (telemetry: EvalTelemetry): Array<{ toolName: string; count: number }> => {
    return getToolCallCountsFromSequence(getToolCallSequence(telemetry));
};

const getFlattenedToolCalls = (telemetry: EvalTelemetry): EvalFlattenedToolCall[] => {
    return telemetry.steps.flatMap((step) =>
        step.toolCalls.map((toolCall) => ({ toolName: toolCall.name, stepIndex: step.index })),
    );
};

const analyzeToolCalls = (
    actualCalls: EvalFlattenedToolCall[],
    expectedSequence: string[],
): {
    sequenceMatched: boolean;
    actualSequence: string[];
    missingTools: string[];
    unexpectedTools: string[];
    structurallyUnexpectedTools: string[];
    positionallyUnexpectedTools: string[];
    firstDivergenceIndex: number | null;
    firstDivergenceExpectedTool: string | null;
    firstDivergenceActualTool: string | null;
    firstDivergenceStepIndex: number | null;
} => {
    const actualSequence = actualCalls.map((toolCall) => toolCall.toolName);
    const sequenceMatched =
        actualSequence.length === expectedSequence.length &&
        actualSequence.every((toolName, index) => toolName === expectedSequence[index]);

    const actualCounts = new Map<string, number>();
    for (const toolName of actualSequence) {
        actualCounts.set(toolName, (actualCounts.get(toolName) ?? 0) + 1);
    }

    const missingBudget = new Map(actualCounts);
    const missingTools = expectedSequence.filter((toolName) => {
        const remaining = missingBudget.get(toolName) ?? 0;
        if (remaining > 0) {
            missingBudget.set(toolName, remaining - 1);
            return false;
        }
        return true;
    });

    const expectedSet = new Set(expectedSequence);
    const structurallyUnexpectedTools: string[] = [];
    const positionallyUnexpectedTools: string[] = [];
    let expectedIndex = 0;

    for (const toolCall of actualCalls) {
        if (expectedIndex < expectedSequence.length && toolCall.toolName === expectedSequence[expectedIndex]) {
            expectedIndex += 1;
            continue;
        }

        if (expectedSet.has(toolCall.toolName)) {
            positionallyUnexpectedTools.push(toolCall.toolName);
            continue;
        }

        structurallyUnexpectedTools.push(toolCall.toolName);
    }

    const firstDivergencePosition = (() => {
        const maxLength = Math.max(expectedSequence.length, actualSequence.length);
        for (let index = 0; index < maxLength; index += 1) {
            if (expectedSequence[index] !== actualSequence[index]) {
                return index;
            }
        }
        return null;
    })();

    return {
        sequenceMatched,
        actualSequence,
        missingTools,
        unexpectedTools: [...positionallyUnexpectedTools, ...structurallyUnexpectedTools],
        structurallyUnexpectedTools,
        positionallyUnexpectedTools,
        firstDivergenceIndex: firstDivergencePosition === null ? null : firstDivergencePosition + 1,
        firstDivergenceExpectedTool:
            firstDivergencePosition === null ? null : (expectedSequence[firstDivergencePosition] ?? null),
        firstDivergenceActualTool:
            firstDivergencePosition === null ? null : (actualSequence[firstDivergencePosition] ?? null),
        firstDivergenceStepIndex:
            firstDivergencePosition === null ? null : (actualCalls[firstDivergencePosition]?.stepIndex ?? null),
    };
};

export const analyzeToolCallSequence = (
    actualSequence: string[],
    expectedSequence: string[],
): {
    sequenceMatched: boolean;
    actualSequence: string[];
    missingTools: string[];
    unexpectedTools: string[];
    structurallyUnexpectedTools: string[];
    positionallyUnexpectedTools: string[];
    firstDivergenceIndex: number | null;
    firstDivergenceExpectedTool: string | null;
    firstDivergenceActualTool: string | null;
    firstDivergenceStepIndex: number | null;
} => {
    return analyzeToolCalls(
        actualSequence.map((toolName) => ({ toolName, stepIndex: null })),
        expectedSequence,
    );
};

export const analyzeToolSequence = (
    telemetry: EvalTelemetry,
    expectedSequence: string[],
): {
    sequenceMatched: boolean;
    actualSequence: string[];
    missingTools: string[];
    unexpectedTools: string[];
    structurallyUnexpectedTools: string[];
    positionallyUnexpectedTools: string[];
    firstDivergenceIndex: number | null;
    firstDivergenceExpectedTool: string | null;
    firstDivergenceActualTool: string | null;
    firstDivergenceStepIndex: number | null;
} => {
    return analyzeToolCalls(getFlattenedToolCalls(telemetry), expectedSequence);
};

export const getForbiddenToolViolations = (
    telemetry: EvalTelemetry,
    forbiddenTools: string[],
): Array<{ toolName: string; firstStepIndex: number; snippet: Array<{ stepIndex: number; toolNames: string[] }> }> => {
    return forbiddenTools.flatMap((forbiddenTool) => {
        const violatingStep = telemetry.steps.find((step) =>
            step.toolCalls.some((toolCall) => toolCall.name === forbiddenTool),
        );
        if (!violatingStep) {
            return [];
        }

        const snippet = telemetry.steps
            .filter((step) => Math.abs(step.index - violatingStep.index) <= 1)
            .map((step) => ({
                stepIndex: step.index,
                toolNames: step.toolCalls.map((toolCall) => toolCall.name),
            }));

        return [
            {
                toolName: forbiddenTool,
                firstStepIndex: violatingStep.index,
                snippet,
            },
        ];
    });
};

export const getToolFrequencySummaryFromSequences = (
    toolCallRuns: string[][],
): Array<{ toolName: string; totalCalls: number; runsWithTool: number }> => {
    const invocationCounts = new Map<string, number>();
    const runCoverageCounts = new Map<string, number>();

    for (const toolNames of toolCallRuns) {
        const toolsInRun = new Set(toolNames);

        for (const toolName of toolNames) {
            invocationCounts.set(toolName, (invocationCounts.get(toolName) ?? 0) + 1);
        }

        for (const toolName of toolsInRun) {
            runCoverageCounts.set(toolName, (runCoverageCounts.get(toolName) ?? 0) + 1);
        }
    }

    return Array.from(invocationCounts.entries()).map(([toolName, count]) => ({
        toolName,
        totalCalls: count,
        runsWithTool: runCoverageCounts.get(toolName) ?? 0,
    }));
};

export const getToolFrequencySummary = (
    telemetries: Array<EvalTelemetry | null>,
): Array<{ toolName: string; totalCalls: number; runsWithTool: number }> => {
    return getToolFrequencySummaryFromSequences(
        telemetries.map((telemetry) => (telemetry ? getToolCallSequence(telemetry) : [])),
    );
};
