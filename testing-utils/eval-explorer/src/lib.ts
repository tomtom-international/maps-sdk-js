import type { EvalCaseComparisonRow, EvalReportSummary } from '../../src/eval/compare';
import { buildEvalCaseComparisonRows, summarizeEvalReport } from '../../src/eval/compare';
import type { EvalLoadedReport } from '../../src/eval/report';
import { parseEvalReport, parseEvalReportJson } from '../../src/eval/report';
import type { ExplorerManifest } from './types';

const slugify = (value: string): string =>
    value
        .toLowerCase()
        .replaceAll(/[^a-z0-9]+/g, '-')
        .replaceAll(/^-+|-+$/g, '')
        .slice(0, 48);

export const createLoadedReport = (
    label: string,
    source: string,
    reportText: string,
    indexSeed: number,
): EvalLoadedReport => {
    const report = parseEvalReportJson(reportText, source);
    const slug = slugify(label || source || `report-${indexSeed + 1}`) || `report-${indexSeed + 1}`;

    return {
        id: `${slug}-${indexSeed + 1}`,
        label: label || `Report ${indexSeed + 1}`,
        source,
        report,
    };
};

export const normalizeManifestReports = (manifest: ExplorerManifest): EvalLoadedReport[] => {
    return manifest.reports.map((loadedReport, index) => ({
        ...loadedReport,
        id: loadedReport.id || `preloaded-${index + 1}`,
        label: loadedReport.label || `Preloaded ${index + 1}`,
        report: parseEvalReport(loadedReport.report, loadedReport.source || loadedReport.label),
    }));
};

export const buildReportSummaries = (loadedReports: EvalLoadedReport[]): EvalReportSummary[] => {
    return loadedReports.map((loadedReport) => summarizeEvalReport(loadedReport));
};

export const buildComparisonRows = (
    loadedReports: EvalLoadedReport[],
    baselineReportId: string,
): EvalCaseComparisonRow[] => {
    return buildEvalCaseComparisonRows(loadedReports, baselineReportId);
};
