import fs from 'node:fs';
import path from 'node:path';
import type { FullConfig, FullResult, Reporter, TestCase, TestResult } from '@playwright/test/reporter';
import type { EvalTelemetry } from './types';

type EvalMeta = {
    caseId: string;
    runIndex: number;
    passThreshold: number;
};

type EvalRecord = {
    caseId: string;
    runIndex: number;
    passThreshold: number;
    passed: boolean;
    telemetry: EvalTelemetry | null;
    screenshotFailed: boolean;
};

const toNumber = (value: number | undefined): number => value ?? 0;

const getStats = (values: number[]) => {
    if (values.length === 0) {
        return { min: 0, max: 0, mean: 0, median: 0 };
    }

    const sortedValues = [...values].sort((a, b) => a - b);
    const total = sortedValues.reduce((sum, value) => sum + value, 0);
    const middle = Math.floor(sortedValues.length / 2);
    const median =
        sortedValues.length % 2 === 0 ? (sortedValues[middle - 1] + sortedValues[middle]) / 2 : sortedValues[middle];

    return {
        min: sortedValues[0],
        max: sortedValues.at(-1) ?? 0,
        mean: total / sortedValues.length,
        median,
    };
};

const parseAttachmentBody = <T>(result: TestResult, attachmentName: string): T | null => {
    const attachment = result.attachments.find((item) => item.name === attachmentName);
    if (!attachment) {
        return null;
    }

    const body = attachment.body ?? (attachment.path ? fs.readFileSync(attachment.path) : null);
    if (!body) {
        return null;
    }

    const rawContent = Buffer.isBuffer(body) ? body.toString('utf8') : String(body);
    try {
        return JSON.parse(rawContent) as T;
    } catch {
        return null;
    }
};

export class EvalReporter implements Reporter {
    private readonly records: EvalRecord[] = [];
    private outputFilePath = '';

    onBegin(config: FullConfig): void {
        const defaultOutputDir = path.resolve(process.cwd(), 'e2e-tests/reports');
        const outputDir = config.projects[0]?.outputDir
            ? path.resolve(config.projects[0].outputDir, '..')
            : defaultOutputDir;

        this.outputFilePath = path.resolve(outputDir, 'eval-report.json');
    }

    onTestEnd(_: TestCase, result: TestResult): void {
        const meta = parseAttachmentBody<EvalMeta>(result, 'eval-meta');
        if (!meta) {
            return;
        }

        const telemetry = parseAttachmentBody<EvalTelemetry>(result, 'telemetry');
        const screenshotFailed = result.errors.some((error) => (error.message ?? '').includes('toMatchSnapshot'));

        this.records.push({
            caseId: meta.caseId,
            runIndex: meta.runIndex,
            passThreshold: meta.passThreshold,
            passed: result.status === 'passed',
            telemetry,
            screenshotFailed,
        });
    }

    async onEnd(_: FullResult): Promise<void> {
        const groupedByCase = new Map<string, EvalRecord[]>();
        for (const record of this.records) {
            const caseRecords = groupedByCase.get(record.caseId) ?? [];
            caseRecords.push(record);
            groupedByCase.set(record.caseId, caseRecords);
        }

        const caseSummaries = Array.from(groupedByCase.entries()).map(([caseId, caseRecords]) => {
            const passCount = caseRecords.filter((record) => record.passed).length;
            const totalRuns = caseRecords.length;
            const passRate = totalRuns > 0 ? passCount / totalRuns : 0;
            const passThreshold = caseRecords[0]?.passThreshold ?? 0.8;

            const tokenInputs = caseRecords.map((record) => toNumber(record.telemetry?.totalUsage.inputTokens));
            const tokenOutputs = caseRecords.map((record) => toNumber(record.telemetry?.totalUsage.outputTokens));
            const tokenTotals = caseRecords.map((record) => toNumber(record.telemetry?.totalUsage.totalTokens));
            const stepCounts = caseRecords.map((record) => record.telemetry?.steps.length ?? 0);
            const wallClockMs = caseRecords.map((record) => record.telemetry?.wallClockMs ?? 0);

            const toolFrequency = new Map<string, number>();
            for (const record of caseRecords) {
                const toolsInRun = new Set(
                    (record.telemetry?.steps ?? []).flatMap((step) => step.toolCalls.map((toolCall) => toolCall.name)),
                );
                for (const toolName of toolsInRun) {
                    toolFrequency.set(toolName, (toolFrequency.get(toolName) ?? 0) + 1);
                }
            }

            const allClassifications = caseRecords
                .map((record) => record.telemetry?.classification)
                .filter((classification): classification is NonNullable<EvalTelemetry['classification']> =>
                    Boolean(classification),
                );

            const screenshotFailures = caseRecords.filter((record) => record.screenshotFailed).length;

            return {
                caseId,
                totalRuns,
                passCount,
                passRate,
                passThreshold,
                belowThreshold: passRate < passThreshold,
                tokens: {
                    input: getStats(tokenInputs),
                    output: getStats(tokenOutputs),
                    total: getStats(tokenTotals),
                },
                steps: getStats(stepCounts),
                wallClockMs: getStats(wallClockMs),
                toolFrequency: Array.from(toolFrequency.entries()).map(([toolName, count]) => ({
                    toolName,
                    count,
                    runsRatio: `${count}/${totalRuns}`,
                })),
                classification: {
                    groups: allClassifications.map((classification) => classification.groups),
                    timeMs: getStats(allClassifications.map((classification) => classification.timeMs)),
                },
                screenshots: {
                    failures: screenshotFailures,
                    matches: totalRuns - screenshotFailures,
                },
            };
        });

        const belowThresholdCases = caseSummaries
            .filter((summary) => summary.belowThreshold)
            .map((summary) => summary.caseId);
        const totalTokens = this.records.reduce(
            (sum, record) => sum + toNumber(record.telemetry?.totalUsage.totalTokens),
            0,
        );
        const totalWallClockMs = this.records.reduce((sum, record) => sum + (record.telemetry?.wallClockMs ?? 0), 0);

        const report = {
            generatedAt: new Date().toISOString(),
            totalCases: caseSummaries.length,
            totalRuns: this.records.length,
            belowThresholdCases,
            totals: {
                totalTokens,
                totalWallClockMs,
            },
            cases: caseSummaries,
        };

        fs.mkdirSync(path.dirname(this.outputFilePath), { recursive: true });
        fs.writeFileSync(this.outputFilePath, JSON.stringify(report, null, 2), 'utf8');

        for (const summary of caseSummaries) {
            const passRatePct = (summary.passRate * 100).toFixed(1);
            console.log(
                `[eval] ${summary.caseId} pass ${summary.passCount}/${summary.totalRuns} (${passRatePct}%) tokens(avg) ${summary.tokens.total.mean.toFixed(1)} steps(avg) ${summary.steps.mean.toFixed(2)}`,
            );
        }

        if (belowThresholdCases.length > 0) {
            console.error(`[eval] pass-rate threshold not met for: ${belowThresholdCases.join(', ')}`);
            process.exitCode = 1;
        }
    }
}

export default EvalReporter;
