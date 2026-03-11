export type EvalNumericStats = {
    min: number;
    max: number;
    mean: number;
    median: number;
};

export type EvalStepSnippet = {
    stepIndex: number;
    toolNames: string[];
};

export type EvalForbiddenToolViolation = {
    toolName: string;
    firstStepIndex: number;
    snippet: EvalStepSnippet[];
};

export type EvalToolRunReport = {
    runIndex: number;
    passed: boolean;
    actualSequence: string[];
    forbiddenViolations: EvalForbiddenToolViolation[];
};

export type EvalCaseTooling = {
    expectedSequence: string[];
    perRun: EvalToolRunReport[];
};

export type EvalCaseClassificationSummary = {
    groups: string[][];
    timeMs: EvalNumericStats;
};

export type EvalScreenshotSummary = {
    failures: number;
    matches: number;
};

export type EvalCaseReport = {
    caseId: string;
    totalRuns: number;
    passCount: number;
    passRate: number;
    passThreshold: number;
    belowThreshold: boolean;
    tokens: {
        input: EvalNumericStats;
        output: EvalNumericStats;
        total: EvalNumericStats;
    };
    steps: EvalNumericStats;
    wallClockMs: EvalNumericStats;
    tooling: EvalCaseTooling;
    classification: EvalCaseClassificationSummary;
    screenshots: EvalScreenshotSummary;
};

export type EvalReport = {
    generatedAt: string;
    totalCases: number;
    totalRuns: number;
    belowThresholdCases: string[];
    totals: {
        totalTokens: number;
        totalWallClockMs: number;
    };
    cases: EvalCaseReport[];
};

export type EvalLoadedReport = {
    id: string;
    label: string;
    source: string;
    report: EvalReport;
};

const isRecord = (value: unknown): value is Record<string, unknown> => typeof value === 'object' && value !== null;

const isNumber = (value: unknown): value is number => typeof value === 'number' && Number.isFinite(value);

const isString = (value: unknown): value is string => typeof value === 'string';

const isBoolean = (value: unknown): value is boolean => typeof value === 'boolean';

const isStringArray = (value: unknown): value is string[] => Array.isArray(value) && value.every(isString);

const parseNumericStats = (value: unknown, path: string): EvalNumericStats => {
    if (!isRecord(value)) {
        throw new Error(`${path} must be an object.`);
    }

    const { min, max, mean, median } = value;
    if (![min, max, mean, median].every(isNumber)) {
        throw new Error(`${path} must contain numeric min, max, mean, and median values.`);
    }

    return {
        min: Number(min),
        max: Number(max),
        mean: Number(mean),
        median: Number(median),
    };
};

const parseStepSnippet = (value: unknown, path: string): EvalStepSnippet => {
    if (!isRecord(value)) {
        throw new Error(`${path} must be an object.`);
    }

    const { stepIndex, toolNames } = value;
    if (!isNumber(stepIndex) || !isStringArray(toolNames)) {
        throw new Error(`${path} must contain stepIndex and toolNames.`);
    }

    return { stepIndex, toolNames };
};

const parseForbiddenToolViolation = (value: unknown, path: string): EvalForbiddenToolViolation => {
    if (!isRecord(value)) {
        throw new Error(`${path} must be an object.`);
    }

    const { toolName, firstStepIndex, snippet } = value;
    if (!isString(toolName) || !isNumber(firstStepIndex) || !Array.isArray(snippet)) {
        throw new Error(`${path} must contain toolName, firstStepIndex, and snippet.`);
    }

    return {
        toolName,
        firstStepIndex,
        snippet: snippet.map((item, index) => parseStepSnippet(item, `${path}.snippet[${index}]`)),
    };
};

const parseToolRunReport = (value: unknown, path: string): EvalToolRunReport => {
    if (!isRecord(value)) {
        throw new Error(`${path} must be an object.`);
    }

    const { runIndex, passed, actualSequence, forbiddenViolations } = value;
    if (
        !isNumber(runIndex) ||
        !isBoolean(passed) ||
        !isStringArray(actualSequence) ||
        !Array.isArray(forbiddenViolations)
    ) {
        throw new Error(`${path} must contain runIndex, passed, actualSequence, and forbiddenViolations.`);
    }

    return {
        runIndex,
        passed,
        actualSequence,
        forbiddenViolations: forbiddenViolations.map((item, index) =>
            parseForbiddenToolViolation(item, `${path}.forbiddenViolations[${index}]`),
        ),
    };
};

const parseCaseTooling = (value: unknown, path: string): EvalCaseTooling => {
    if (!isRecord(value)) {
        throw new Error(`${path} must be an object.`);
    }

    const { expectedSequence, perRun } = value;
    if (!isStringArray(expectedSequence) || !Array.isArray(perRun)) {
        throw new Error(`${path} must contain expectedSequence and perRun.`);
    }

    return {
        expectedSequence,
        perRun: perRun.map((item, index) => parseToolRunReport(item, `${path}.perRun[${index}]`)),
    };
};

const parseCaseClassificationSummary = (value: unknown, path: string): EvalCaseClassificationSummary => {
    if (!isRecord(value) || !Array.isArray(value.groups)) {
        throw new Error(`${path} must contain a groups array.`);
    }

    const groups = value.groups.map((group, index) => {
        if (!isStringArray(group)) {
            throw new Error(`${path}.groups[${index}] must be an array of strings.`);
        }
        return group;
    });

    return {
        groups,
        timeMs: parseNumericStats(value.timeMs, `${path}.timeMs`),
    };
};

const parseScreenshotSummary = (value: unknown, path: string): EvalScreenshotSummary => {
    if (!isRecord(value)) {
        throw new Error(`${path} must be an object.`);
    }

    const { failures, matches } = value;
    if (!isNumber(failures) || !isNumber(matches)) {
        throw new Error(`${path} must contain numeric failures and matches.`);
    }

    return { failures, matches };
};

const parseCaseReport = (value: unknown, path: string): EvalCaseReport => {
    if (!isRecord(value)) {
        throw new Error(`${path} must be an object.`);
    }

    const { caseId, totalRuns, passCount, passRate, passThreshold, belowThreshold, tokens, steps, wallClockMs } = value;
    if (
        !isString(caseId) ||
        !isNumber(totalRuns) ||
        !isNumber(passCount) ||
        !isNumber(passRate) ||
        !isNumber(passThreshold) ||
        typeof belowThreshold !== 'boolean'
    ) {
        throw new Error(`${path} has invalid case summary fields.`);
    }

    if (!isRecord(tokens)) {
        throw new Error(`${path}.tokens must be an object.`);
    }

    return {
        caseId,
        totalRuns,
        passCount,
        passRate,
        passThreshold,
        belowThreshold,
        tokens: {
            input: parseNumericStats(tokens.input, `${path}.tokens.input`),
            output: parseNumericStats(tokens.output, `${path}.tokens.output`),
            total: parseNumericStats(tokens.total, `${path}.tokens.total`),
        },
        steps: parseNumericStats(steps, `${path}.steps`),
        wallClockMs: parseNumericStats(wallClockMs, `${path}.wallClockMs`),
        tooling: parseCaseTooling(value.tooling, `${path}.tooling`),
        classification: parseCaseClassificationSummary(value.classification, `${path}.classification`),
        screenshots: parseScreenshotSummary(value.screenshots, `${path}.screenshots`),
    };
};

export const parseEvalReport = (value: unknown, sourceLabel = 'Eval report'): EvalReport => {
    if (!isRecord(value)) {
        throw new Error(`${sourceLabel} must be a JSON object.`);
    }

    const { generatedAt, totalCases, totalRuns, belowThresholdCases, totals, cases } = value;
    if (
        !isString(generatedAt) ||
        !isNumber(totalCases) ||
        !isNumber(totalRuns) ||
        !isStringArray(belowThresholdCases)
    ) {
        throw new Error(`${sourceLabel} is missing top-level summary fields.`);
    }

    if (!isRecord(totals) || !isNumber(totals.totalTokens) || !isNumber(totals.totalWallClockMs)) {
        throw new Error(`${sourceLabel}.totals must contain numeric totalTokens and totalWallClockMs.`);
    }

    if (!Array.isArray(cases)) {
        throw new TypeError(`${sourceLabel}.cases must be an array.`);
    }

    return {
        generatedAt,
        totalCases,
        totalRuns,
        belowThresholdCases,
        totals: {
            totalTokens: totals.totalTokens,
            totalWallClockMs: totals.totalWallClockMs,
        },
        cases: cases.map((item, index) => parseCaseReport(item, `${sourceLabel}.cases[${index}]`)),
    };
};

export const parseEvalReportJson = (text: string, sourceLabel = 'Eval report'): EvalReport => {
    let parsed: unknown;
    try {
        parsed = JSON.parse(text) as unknown;
    } catch (error) {
        const message = error instanceof Error ? error.message : 'Unknown JSON parsing error.';
        throw new Error(`${sourceLabel} is not valid JSON: ${message}`);
    }

    return parseEvalReport(parsed, sourceLabel);
};
