import type { EvalCaseReport, EvalLoadedReport, EvalReport } from './report';

export type EvalCaseDelta = {
    passRate: number;
    totalTokensMean: number;
    stepsMean: number;
    wallClockMsMean: number;
    becameBelowThreshold: boolean;
    becameWithinThreshold: boolean;
};

export type EvalCaseComparisonEntry = {
    reportId: string;
    label: string;
    caseReport: EvalCaseReport | null;
    deltaFromBaseline: EvalCaseDelta | null;
    isMissing: boolean;
};

export type EvalCaseComparisonRow = {
    caseId: string;
    baseline: EvalCaseReport | null;
    entries: EvalCaseComparisonEntry[];
    regressionCount: number;
    improvementCount: number;
    missingCount: number;
    belowThresholdCount: number;
};

export type EvalReportSummary = {
    id: string;
    label: string;
    generatedAt: string;
    totalCases: number;
    totalRuns: number;
    belowThresholdCount: number;
    totalTokens: number;
    totalWallClockMs: number;
};

const createCaseMap = (report: EvalReport): Map<string, EvalCaseReport> => {
    return new Map(report.cases.map((caseReport) => [caseReport.caseId, caseReport]));
};

const createDelta = (baseline: EvalCaseReport, current: EvalCaseReport): EvalCaseDelta => {
    return {
        passRate: current.passRate - baseline.passRate,
        totalTokensMean: current.tokens.total.mean - baseline.tokens.total.mean,
        stepsMean: current.steps.mean - baseline.steps.mean,
        wallClockMsMean: current.wallClockMs.mean - baseline.wallClockMs.mean,
        becameBelowThreshold: current.belowThreshold && !baseline.belowThreshold,
        becameWithinThreshold: !current.belowThreshold && baseline.belowThreshold,
    };
};

const isRegression = (delta: EvalCaseDelta | null): boolean => {
    if (!delta) {
        return false;
    }

    return (
        delta.passRate < 0 ||
        delta.totalTokensMean > 0 ||
        delta.stepsMean > 0 ||
        delta.wallClockMsMean > 0 ||
        delta.becameBelowThreshold
    );
};

const isImprovement = (delta: EvalCaseDelta | null): boolean => {
    if (!delta) {
        return false;
    }

    return (
        delta.passRate > 0 ||
        delta.totalTokensMean < 0 ||
        delta.stepsMean < 0 ||
        delta.wallClockMsMean < 0 ||
        delta.becameWithinThreshold
    );
};

export const summarizeEvalReport = (loadedReport: EvalLoadedReport): EvalReportSummary => {
    const { id, label, report } = loadedReport;

    return {
        id,
        label,
        generatedAt: report.generatedAt,
        totalCases: report.totalCases,
        totalRuns: report.totalRuns,
        belowThresholdCount: report.belowThresholdCases.length,
        totalTokens: report.totals.totalTokens,
        totalWallClockMs: report.totals.totalWallClockMs,
    };
};

export const buildEvalCaseComparisonRows = (
    loadedReports: EvalLoadedReport[],
    baselineReportId: string,
): EvalCaseComparisonRow[] => {
    const baselineReport = loadedReports.find((report) => report.id === baselineReportId);
    if (!baselineReport) {
        return [];
    }

    const caseIds = new Set<string>();
    const caseMaps = new Map<string, Map<string, EvalCaseReport>>();
    for (const loadedReport of loadedReports) {
        const caseMap = createCaseMap(loadedReport.report);
        caseMaps.set(loadedReport.id, caseMap);
        for (const caseId of caseMap.keys()) {
            caseIds.add(caseId);
        }
    }

    const baselineCaseMap = caseMaps.get(baselineReport.id) ?? new Map<string, EvalCaseReport>();

    return Array.from(caseIds)
        .sort((left, right) => left.localeCompare(right))
        .map((caseId) => {
            const baseline = baselineCaseMap.get(caseId) ?? null;
            const entries = loadedReports.map((loadedReport) => {
                const caseReport = caseMaps.get(loadedReport.id)?.get(caseId) ?? null;
                const deltaFromBaseline = baseline && caseReport ? createDelta(baseline, caseReport) : null;

                return {
                    reportId: loadedReport.id,
                    label: loadedReport.label,
                    caseReport,
                    deltaFromBaseline,
                    isMissing: caseReport === null,
                };
            });

            return {
                caseId,
                baseline,
                entries,
                regressionCount: entries.filter((entry) => isRegression(entry.deltaFromBaseline)).length,
                improvementCount: entries.filter((entry) => isImprovement(entry.deltaFromBaseline)).length,
                missingCount: entries.filter((entry) => entry.isMissing).length,
                belowThresholdCount: entries.filter((entry) => entry.caseReport?.belowThreshold).length,
            };
        });
};
