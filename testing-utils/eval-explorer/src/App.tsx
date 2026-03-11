import { useEffect, useMemo, useState } from 'react';
import type { ChangeEvent, DragEvent } from 'react';
import type { EvalCaseComparisonEntry, EvalCaseComparisonRow, EvalReportSummary } from '../../src/eval/compare';
import type { EvalLoadedReport } from '../../src/eval/report';
import {
    analyzeToolCallSequence,
    getToolCallCountsFromSequence,
    getToolFrequencySummaryFromSequences,
} from '../../src/eval/tool-calls';
import { buildComparisonRows, buildReportSummaries, createLoadedReport, normalizeManifestReports } from './lib';
import { formatDeltaPercent, formatDuration, formatInteger, formatPercent, formatSignedNumber } from './format';
import type { ExplorerFilterState, ExplorerManifest, ReportLoadError } from './types';

const INITIAL_FILTERS: ExplorerFilterState = {
    search: '',
    belowThresholdOnly: false,
    regressionsOnly: false,
    improvementsOnly: false,
    missingOnly: false,
};

const PRELOADED_REPORTS_URL = '/preloaded-reports.json';

const formatSequence = (tools: string[]): string => {
    return tools.length > 0 ? tools.join(' -> ') : 'No tool calls';
};

const compareLabel = (entry: EvalCaseComparisonEntry, baselineReportId: string): string => {
    if (entry.reportId === baselineReportId) {
        return 'Baseline';
    }

    return entry.isMissing ? 'Missing' : 'Compared';
};

const sortRows = (rows: EvalCaseComparisonRow[]): EvalCaseComparisonRow[] => {
    return [...rows].sort((left, right) => {
        if (left.regressionCount !== right.regressionCount) {
            return right.regressionCount - left.regressionCount;
        }

        if (left.belowThresholdCount !== right.belowThresholdCount) {
            return right.belowThresholdCount - left.belowThresholdCount;
        }

        return left.caseId.localeCompare(right.caseId);
    });
};

const filterRows = (rows: EvalCaseComparisonRow[], filters: ExplorerFilterState): EvalCaseComparisonRow[] => {
    const normalizedSearch = filters.search.trim().toLowerCase();

    return sortRows(
        rows.filter((row) => {
            if (normalizedSearch && !row.caseId.toLowerCase().includes(normalizedSearch)) {
                return false;
            }

            if (filters.belowThresholdOnly && row.belowThresholdCount === 0) {
                return false;
            }

            if (filters.regressionsOnly && row.regressionCount === 0) {
                return false;
            }

            if (filters.improvementsOnly && row.improvementCount === 0) {
                return false;
            }

            if (filters.missingOnly && row.missingCount === 0) {
                return false;
            }

            return true;
        }),
    );
};

const readFiles = async (files: FileList | File[]): Promise<Array<{ name: string; text: string }>> => {
    return Promise.all(
        Array.from(files).map(async (file) => ({
            name: file.name,
            text: await file.text(),
        })),
    );
};

type ExplorerControlsProps = {
    baselineReportId: string;
    filters: ExplorerFilterState;
    loadedReports: EvalLoadedReport[];
    visibleReportIds: string[];
    visibleReports: EvalLoadedReport[];
    onBaselineChange: (reportId: string) => void;
    onDrop: (event: DragEvent<HTMLLabelElement>) => Promise<void>;
    onFileInput: (event: ChangeEvent<HTMLInputElement>) => Promise<void>;
    onFilterChange: (updater: (current: ExplorerFilterState) => ExplorerFilterState) => void;
    onToggleVisibleReport: (reportId: string, checked: boolean) => void;
    onUpdateReportLabel: (reportId: string, label: string) => void;
};

type ImportErrorsProps = Readonly<{ errors: ReportLoadError[] }>;

type ReportSummaryGridProps = Readonly<{
    summaries: EvalReportSummary[];
    baselineReportId: string;
}>;

type CaseComparisonTableProps = Readonly<{
    activeBaseline: EvalLoadedReport | null;
    filteredRows: EvalCaseComparisonRow[];
    selectedCaseId: string;
    onSelectCase: (caseId: string) => void;
}>;

type CaseDetailEntryProps = Readonly<{
    baselineReportId: string;
    entry: EvalCaseComparisonEntry;
}>;

type CaseDetailPanelProps = Readonly<{
    baselineReportId: string;
    selectedRow: EvalCaseComparisonRow | null;
}>;

function ExplorerControls({
    baselineReportId,
    filters,
    loadedReports,
    visibleReportIds,
    visibleReports,
    onBaselineChange,
    onDrop,
    onFileInput,
    onFilterChange,
    onToggleVisibleReport,
    onUpdateReportLabel,
}: Readonly<ExplorerControlsProps>) {
    return (
        <section className="top-grid">
            <label className="dropzone" onDragOver={(event) => event.preventDefault()} onDrop={onDrop}>
                <input type="file" accept="application/json,.json" multiple onChange={onFileInput} />
                <span className="dropzone-title">Drop eval-report-*.json files here</span>
                <span className="dropzone-copy">
                    Or browse local files. Preloaded reports from the launcher appear automatically.
                </span>
            </label>

            <div className="control-card">
                <div className="control-row">
                    <label htmlFor="baseline-report">Baseline report</label>
                    <select
                        id="baseline-report"
                        value={baselineReportId}
                        onChange={(event) => onBaselineChange(event.target.value)}
                    >
                        {visibleReports.map((report) => (
                            <option key={report.id} value={report.id}>
                                {report.label}
                            </option>
                        ))}
                    </select>
                </div>

                <div className="report-list">
                    {loadedReports.map((report) => (
                        <div key={report.id} className="report-list-item">
                            <label>
                                <input
                                    type="checkbox"
                                    checked={visibleReportIds.length === 0 || visibleReportIds.includes(report.id)}
                                    onChange={(event) => onToggleVisibleReport(report.id, event.target.checked)}
                                />
                                <span>{report.source}</span>
                            </label>
                            <input
                                type="text"
                                value={report.label}
                                onChange={(event) => onUpdateReportLabel(report.id, event.target.value)}
                                aria-label={`Label for ${report.source}`}
                            />
                        </div>
                    ))}
                </div>

                <div className="control-row">
                    <label htmlFor="case-search">Find case</label>
                    <input
                        id="case-search"
                        type="search"
                        placeholder="Search by case id"
                        value={filters.search}
                        onChange={(event) => onFilterChange((current) => ({ ...current, search: event.target.value }))}
                    />
                </div>

                <div className="toggle-grid">
                    <label>
                        <input
                            type="checkbox"
                            checked={filters.belowThresholdOnly}
                            onChange={(event) =>
                                onFilterChange((current) => ({ ...current, belowThresholdOnly: event.target.checked }))
                            }
                        />
                        <span>Below threshold</span>
                    </label>
                    <label>
                        <input
                            type="checkbox"
                            checked={filters.regressionsOnly}
                            onChange={(event) =>
                                onFilterChange((current) => ({ ...current, regressionsOnly: event.target.checked }))
                            }
                        />
                        <span>Regressions only</span>
                    </label>
                    <label>
                        <input
                            type="checkbox"
                            checked={filters.improvementsOnly}
                            onChange={(event) =>
                                onFilterChange((current) => ({ ...current, improvementsOnly: event.target.checked }))
                            }
                        />
                        <span>Improvements only</span>
                    </label>
                    <label>
                        <input
                            type="checkbox"
                            checked={filters.missingOnly}
                            onChange={(event) =>
                                onFilterChange((current) => ({ ...current, missingOnly: event.target.checked }))
                            }
                        />
                        <span>Missing cases</span>
                    </label>
                </div>
            </div>
        </section>
    );
}

function ImportErrors({ errors }: ImportErrorsProps) {
    if (errors.length === 0) {
        return null;
    }

    return (
        <section className="error-panel">
            <h2>Import errors</h2>
            <ul>
                {errors.map((error) => (
                    <li key={error.id}>
                        <strong>{error.source}</strong>
                        <span>{error.message}</span>
                    </li>
                ))}
            </ul>
        </section>
    );
}

function ReportSummaryGrid({ summaries, baselineReportId }: ReportSummaryGridProps) {
    return (
        <section className="summary-grid">
            {summaries.map((summary) => (
                <article
                    key={summary.id}
                    className={summary.id === baselineReportId ? 'summary-card summary-card-baseline' : 'summary-card'}
                >
                    <header>
                        <p>{summary.label}</p>
                        <span>{summary.id === baselineReportId ? 'Baseline' : 'Report'}</span>
                    </header>
                    <dl>
                        <div>
                            <dt>Cases</dt>
                            <dd>{formatInteger(summary.totalCases)}</dd>
                        </div>
                        <div>
                            <dt>Runs</dt>
                            <dd>{formatInteger(summary.totalRuns)}</dd>
                        </div>
                        <div>
                            <dt>Below threshold</dt>
                            <dd>{formatInteger(summary.belowThresholdCount)}</dd>
                        </div>
                        <div>
                            <dt>Total tokens</dt>
                            <dd>{formatInteger(summary.totalTokens)}</dd>
                        </div>
                        <div>
                            <dt>Total wall clock</dt>
                            <dd>{formatDuration(summary.totalWallClockMs)}</dd>
                        </div>
                    </dl>
                    <footer>{summary.generatedAt}</footer>
                </article>
            ))}
        </section>
    );
}

function CaseComparisonTable({ activeBaseline, filteredRows, selectedCaseId, onSelectCase }: CaseComparisonTableProps) {
    return (
        <div className="table-card">
            <div className="section-heading">
                <div>
                    <p className="eyebrow">Case comparison</p>
                    <h2>{filteredRows.length} visible cases</h2>
                </div>
                <p className="section-copy">Sorted to surface the cases with the most regressions first.</p>
            </div>

            {activeBaseline ? <p className="baseline-banner">Baseline: {activeBaseline.label}</p> : null}

            <div className="table-scroll">
                <table>
                    <thead>
                        <tr>
                            <th>Case</th>
                            <th>Regressions</th>
                            <th>Below threshold</th>
                            <th>Missing</th>
                            <th>Baseline pass</th>
                            <th>Baseline tokens</th>
                        </tr>
                    </thead>
                    <tbody>
                        {filteredRows.map((row) => (
                            <tr
                                key={row.caseId}
                                className={row.caseId === selectedCaseId ? 'row-active' : ''}
                                onClick={() => onSelectCase(row.caseId)}
                            >
                                <td>
                                    <strong>{row.caseId}</strong>
                                    <span>{row.improvementCount} improvements</span>
                                </td>
                                <td>{formatInteger(row.regressionCount)}</td>
                                <td>{formatInteger(row.belowThresholdCount)}</td>
                                <td>{formatInteger(row.missingCount)}</td>
                                <td>{row.baseline ? formatPercent(row.baseline.passRate) : 'n/a'}</td>
                                <td>{row.baseline ? formatInteger(row.baseline.tokens.total.mean) : 'n/a'}</td>
                            </tr>
                        ))}
                    </tbody>
                </table>
            </div>
        </div>
    );
}

function CaseMetrics({ entry }: Readonly<{ entry: EvalCaseComparisonEntry }>) {
    if (!entry.caseReport) {
        return <p className="empty-copy">This case does not exist in the selected report.</p>;
    }

    return (
        <dl className="metrics-grid">
            <div>
                <dt>Pass rate</dt>
                <dd>{formatPercent(entry.caseReport.passRate)}</dd>
            </div>
            <div>
                <dt>Total tokens mean</dt>
                <dd>{formatInteger(entry.caseReport.tokens.total.mean)}</dd>
            </div>
            <div>
                <dt>Steps mean</dt>
                <dd>{formatSignedNumber(entry.caseReport.steps.mean)}</dd>
            </div>
            <div>
                <dt>Latency mean</dt>
                <dd>{formatDuration(entry.caseReport.wallClockMs.mean)}</dd>
            </div>
            <div>
                <dt>Screenshot matches</dt>
                <dd>{formatInteger(entry.caseReport.screenshots.matches)}</dd>
            </div>
            <div>
                <dt>Screenshot failures</dt>
                <dd>{formatInteger(entry.caseReport.screenshots.failures)}</dd>
            </div>
        </dl>
    );
}

function CaseDeltas({ entry }: Readonly<{ entry: EvalCaseComparisonEntry }>) {
    if (!entry.deltaFromBaseline) {
        return null;
    }

    return (
        <div className="delta-strip">
            <span className={entry.deltaFromBaseline.passRate < 0 ? 'delta negative' : 'delta positive'}>
                Pass {formatDeltaPercent(entry.deltaFromBaseline.passRate)}
            </span>
            <span className={entry.deltaFromBaseline.totalTokensMean > 0 ? 'delta negative' : 'delta positive'}>
                Tokens {formatSignedNumber(entry.deltaFromBaseline.totalTokensMean)}
            </span>
            <span className={entry.deltaFromBaseline.stepsMean > 0 ? 'delta negative' : 'delta positive'}>
                Steps {formatSignedNumber(entry.deltaFromBaseline.stepsMean)}
            </span>
            <span className={entry.deltaFromBaseline.wallClockMsMean > 0 ? 'delta negative' : 'delta positive'}>
                Latency {formatSignedNumber(entry.deltaFromBaseline.wallClockMsMean)} ms
            </span>
        </div>
    );
}

function ToolFrequencySection({ entry }: Readonly<{ entry: EvalCaseComparisonEntry }>) {
    if (!entry.caseReport) {
        return null;
    }

    const caseReport = entry.caseReport;

    const frequency = getToolFrequencySummaryFromSequences(caseReport.tooling.perRun.map((run) => run.actualSequence));

    return (
        <div>
            <p className="subheading">Tool frequency</p>
            <div className="chip-row">
                {frequency.length > 0 ? (
                    frequency.map((tool) => (
                        <span key={tool.toolName} className="chip">
                            {tool.toolName} · {tool.runsWithTool}/{caseReport.totalRuns}
                        </span>
                    ))
                ) : (
                    <span className="chip chip-muted">No recorded tool calls</span>
                )}
            </div>
        </div>
    );
}

function ToolCountsPerRunSection({ entry }: Readonly<{ entry: EvalCaseComparisonEntry }>) {
    if (!entry.caseReport) {
        return null;
    }

    const runs = entry.caseReport.tooling.perRun;

    return (
        <div>
            <p className="subheading">Per-run tool counts</p>
            {runs.length > 0 ? (
                <div className="diagnostic-stack">
                    {runs.map((run) => (
                        <section key={`counts-${run.runIndex}`} className="diagnostic-card">
                            <div className="diagnostic-header">
                                <strong>Run {run.runIndex}</strong>
                                <span className={run.passed ? 'pill pill-ok' : 'pill pill-danger'}>
                                    {run.passed ? 'Passed' : 'Failed'}
                                </span>
                            </div>
                            <p className="empty-copy">
                                {formatInteger(run.actualSequence.length)} tool calls recorded.
                            </p>
                            <div className="chip-row">
                                {run.actualSequence.length > 0 ? (
                                    getToolCallCountsFromSequence(run.actualSequence).map((tool) => (
                                        <span key={`${run.runIndex}-${tool.toolName}`} className="chip">
                                            {tool.toolName} x{tool.count}
                                        </span>
                                    ))
                                ) : (
                                    <span className="chip chip-muted">No tool calls</span>
                                )}
                            </div>
                        </section>
                    ))}
                </div>
            ) : (
                <p className="empty-copy">This report does not include per-run tool counts.</p>
            )}
        </div>
    );
}

function FailedRunDiagnosticsSection({ entry }: Readonly<{ entry: EvalCaseComparisonEntry }>) {
    if (!entry.caseReport) {
        return null;
    }

    const caseReport = entry.caseReport;

    const runs = caseReport.tooling.perRun.map((run) => ({
        ...run,
        analysis: analyzeToolCallSequence(run.actualSequence, caseReport.tooling.expectedSequence),
    }));
    const failingRuns = runs.filter((run) => {
        return !run.analysis.sequenceMatched || run.forbiddenViolations.length > 0;
    });

    let content: React.JSX.Element;
    if (runs.length === 0) {
        content = <p className="empty-copy">This report does not include per-run assertion diagnostics.</p>;
    } else if (failingRuns.length === 0) {
        content = <p className="empty-copy">No tool-selection failures recorded for this case.</p>;
    } else {
        content = (
            <div className="diagnostic-stack">
                {failingRuns.map((run) => {
                    const counts = getToolCallCountsFromSequence(run.actualSequence);

                    return (
                        <section key={`failure-${run.runIndex}`} className="diagnostic-card">
                            <div className="diagnostic-header">
                                <strong>Run {run.runIndex}</strong>
                                <span className={run.passed ? 'pill pill-muted' : 'pill pill-danger'}>
                                    {run.passed ? 'Recovered' : 'Failed'}
                                </span>
                            </div>

                            <div className="sequence-block">
                                <p className="sequence-line">
                                    <span className="sequence-label">Expected</span>
                                    <span className="sequence-code">
                                        {formatSequence(caseReport.tooling.expectedSequence)}
                                    </span>
                                </p>
                                <p className="sequence-line">
                                    <span className="sequence-label">Actual</span>
                                    <span className="sequence-code">{formatSequence(run.analysis.actualSequence)}</span>
                                </p>
                            </div>

                            {run.analysis.firstDivergenceIndex === null ? null : (
                                <p className="empty-copy">
                                    Divergence at call {run.analysis.firstDivergenceIndex}: expected{' '}
                                    {run.analysis.firstDivergenceExpectedTool ?? 'none'}, actual{' '}
                                    {run.analysis.firstDivergenceActualTool ?? 'none'}
                                    {run.analysis.firstDivergenceStepIndex === null
                                        ? ''
                                        : `, step ${run.analysis.firstDivergenceStepIndex}`}
                                    .
                                </p>
                            )}

                            <div className="chip-row">
                                {run.analysis.missingTools.length > 0 ? (
                                    run.analysis.missingTools.map((toolName, index) => (
                                        <span
                                            key={`missing-${run.runIndex}-${toolName}-${index}`}
                                            className="chip chip-muted"
                                        >
                                            Missing {toolName}
                                        </span>
                                    ))
                                ) : (
                                    <span className="chip chip-muted">No missing tools</span>
                                )}
                                {run.analysis.unexpectedTools.map((toolName, index) => (
                                    <span key={`unexpected-${run.runIndex}-${toolName}-${index}`} className="chip">
                                        Unexpected {toolName}
                                    </span>
                                ))}
                            </div>

                            {run.analysis.positionallyUnexpectedTools.length > 0 ||
                            run.analysis.structurallyUnexpectedTools.length > 0 ? (
                                <div className="chip-row">
                                    {run.analysis.positionallyUnexpectedTools.map((toolName, index) => (
                                        <span key={`positional-${run.runIndex}-${toolName}-${index}`} className="chip">
                                            Wrong time {toolName}
                                        </span>
                                    ))}
                                    {run.analysis.structurallyUnexpectedTools.map((toolName, index) => (
                                        <span
                                            key={`structural-${run.runIndex}-${toolName}-${index}`}
                                            className="chip chip-muted"
                                        >
                                            Not expected {toolName}
                                        </span>
                                    ))}
                                </div>
                            ) : null}

                            <div className="chip-row">
                                {counts.length > 0 ? (
                                    counts.map((tool) => (
                                        <span key={`run-count-${run.runIndex}-${tool.toolName}`} className="chip">
                                            {tool.toolName} x{tool.count}
                                        </span>
                                    ))
                                ) : (
                                    <span className="chip chip-muted">No tool count data</span>
                                )}
                            </div>

                            {run.forbiddenViolations.length > 0 ? (
                                <div className="diagnostic-stack">
                                    {run.forbiddenViolations.map((violation) => (
                                        <div
                                            key={`forbidden-${run.runIndex}-${violation.toolName}`}
                                            className="violation-card"
                                        >
                                            <p className="empty-copy">
                                                Forbidden tool {violation.toolName} first appeared at step{' '}
                                                {violation.firstStepIndex}.
                                            </p>
                                            <div className="snippet-grid">
                                                {violation.snippet.map((step) => (
                                                    <div
                                                        key={`snippet-${run.runIndex}-${violation.toolName}-${step.stepIndex}`}
                                                        className="snippet-step"
                                                    >
                                                        <strong>Step {step.stepIndex}</strong>
                                                        <span>{formatSequence(step.toolNames)}</span>
                                                    </div>
                                                ))}
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            ) : null}
                        </section>
                    );
                })}
            </div>
        );
    }

    return (
        <div>
            <p className="subheading">Failed run diagnostics</p>
            {content}
        </div>
    );
}

function CaseDetailEntry({ baselineReportId, entry }: CaseDetailEntryProps) {
    const isBaseline = entry.reportId === baselineReportId;
    const thresholdClass = entry.caseReport?.belowThreshold ? 'pill pill-danger' : 'pill pill-ok';

    return (
        <article className={isBaseline ? 'detail-report detail-report-baseline' : 'detail-report'}>
            <header>
                <div>
                    <h3>{entry.label}</h3>
                    <p>{compareLabel(entry, baselineReportId)}</p>
                </div>
                {entry.caseReport ? (
                    <span className={thresholdClass}>
                        {entry.caseReport.belowThreshold ? 'Below threshold' : 'Within threshold'}
                    </span>
                ) : (
                    <span className="pill pill-muted">Missing</span>
                )}
            </header>

            {entry.caseReport ? (
                <>
                    <CaseMetrics entry={entry} />
                    <CaseDeltas entry={entry} />
                    <ToolFrequencySection entry={entry} />
                    <ToolCountsPerRunSection entry={entry} />
                    <FailedRunDiagnosticsSection entry={entry} />
                </>
            ) : (
                <p className="empty-copy">This case does not exist in the selected report.</p>
            )}
        </article>
    );
}

function CaseDetailPanel({ baselineReportId, selectedRow }: CaseDetailPanelProps) {
    return (
        <aside className="detail-card">
            <div className="section-heading">
                <div>
                    <p className="eyebrow">Selected case</p>
                    <h2>{selectedRow?.caseId ?? 'Load reports to begin'}</h2>
                </div>
            </div>

            {selectedRow ? (
                <div className="detail-stack">
                    {selectedRow.entries.map((entry) => (
                        <CaseDetailEntry
                            key={`${selectedRow.caseId}-${entry.reportId}`}
                            baselineReportId={baselineReportId}
                            entry={entry}
                        />
                    ))}
                </div>
            ) : (
                <p className="empty-copy">Upload eval reports or launch the explorer with preloaded paths.</p>
            )}
        </aside>
    );
}

export function App() {
    const [loadedReports, setLoadedReports] = useState<EvalLoadedReport[]>([]);
    const [loadErrors, setLoadErrors] = useState<ReportLoadError[]>([]);
    const [baselineReportId, setBaselineReportId] = useState('');
    const [visibleReportIds, setVisibleReportIds] = useState<string[]>([]);
    const [filters, setFilters] = useState<ExplorerFilterState>(INITIAL_FILTERS);
    const [selectedCaseId, setSelectedCaseId] = useState('');

    useEffect(() => {
        const loadManifest = async () => {
            try {
                const response = await fetch(PRELOADED_REPORTS_URL, { cache: 'no-store' });
                if (!response.ok) {
                    return;
                }

                const manifest = (await response.json()) as ExplorerManifest;
                const reports = normalizeManifestReports(manifest);
                if (reports.length === 0) {
                    return;
                }

                setLoadedReports(reports);
                setBaselineReportId(reports[0].id);
                setVisibleReportIds(reports.map((report) => report.id));
                setSelectedCaseId(reports[0].report.cases[0]?.caseId ?? '');
            } catch {
                // Ignore empty or missing preload manifests; upload mode remains available.
            }
        };

        void loadManifest();
    }, []);

    const visibleReports = useMemo(() => {
        if (visibleReportIds.length === 0) {
            return loadedReports;
        }

        return loadedReports.filter((report) => visibleReportIds.includes(report.id));
    }, [loadedReports, visibleReportIds]);

    const reportSummaries = useMemo(() => buildReportSummaries(visibleReports), [visibleReports]);
    const comparisonRows = useMemo(
        () => buildComparisonRows(visibleReports, baselineReportId),
        [visibleReports, baselineReportId],
    );
    const filteredRows = useMemo(() => filterRows(comparisonRows, filters), [comparisonRows, filters]);

    const selectedRow = useMemo(() => {
        return filteredRows.find((row) => row.caseId === selectedCaseId) ?? filteredRows[0] ?? null;
    }, [filteredRows, selectedCaseId]);

    useEffect(() => {
        if (selectedRow && selectedRow.caseId !== selectedCaseId) {
            setSelectedCaseId(selectedRow.caseId);
        }

        if (!selectedRow && selectedCaseId) {
            setSelectedCaseId('');
        }
    }, [selectedCaseId, selectedRow]);

    const appendReports = (reports: EvalLoadedReport[], nextErrors: ReportLoadError[]) => {
        setLoadedReports((currentReports) => {
            const nextReports = [...currentReports];
            const nextVisibleIds = new Set(visibleReportIds);

            for (const report of reports) {
                const duplicateIndex = nextReports.findIndex((item) => item.label === report.label);
                if (duplicateIndex >= 0) {
                    const previousId = nextReports[duplicateIndex]?.id;
                    const replacement = { ...report, id: `${report.id}-replacement` };
                    nextReports[duplicateIndex] = replacement;
                    if (previousId) {
                        nextVisibleIds.delete(previousId);
                    }
                    nextVisibleIds.add(replacement.id);
                } else {
                    nextReports.push(report);
                    nextVisibleIds.add(report.id);
                }
            }

            if (!baselineReportId && nextReports[0]) {
                setBaselineReportId(nextReports[0].id);
            }

            setVisibleReportIds(Array.from(nextVisibleIds));
            return nextReports;
        });

        setLoadErrors(nextErrors);
    };

    const handleFiles = async (files: FileList | File[]) => {
        const fileContents = await readFiles(files);
        const nextReports: EvalLoadedReport[] = [];
        const nextErrors: ReportLoadError[] = [];

        for (const [index, file] of fileContents.entries()) {
            try {
                nextReports.push(
                    createLoadedReport(
                        file.name.replace(/\.json$/i, ''),
                        file.name,
                        file.text,
                        loadedReports.length + index,
                    ),
                );
            } catch (error) {
                nextErrors.push({
                    id: `${file.name}-${index}`,
                    source: file.name,
                    message: error instanceof Error ? error.message : 'Unknown report parsing error.',
                });
            }
        }

        appendReports(nextReports, nextErrors);
    };

    const onFileInput = async (event: ChangeEvent<HTMLInputElement>) => {
        if (event.target.files?.length) {
            await handleFiles(event.target.files);
            event.target.value = '';
        }
    };

    const onDrop = async (event: DragEvent<HTMLLabelElement>) => {
        event.preventDefault();
        if (event.dataTransfer.files.length > 0) {
            await handleFiles(event.dataTransfer.files);
        }
    };

    const onToggleVisibleReport = (reportId: string, checked: boolean) => {
        setVisibleReportIds((current) => {
            const next = checked ? [...new Set([...current, reportId])] : current.filter((id) => id !== reportId);
            if (!next.includes(baselineReportId)) {
                const fallbackBaseline = loadedReports.find((report) => next.includes(report.id))?.id ?? '';
                setBaselineReportId(fallbackBaseline);
            }
            return next;
        });
    };

    const onUpdateReportLabel = (reportId: string, label: string) => {
        setLoadedReports((currentReports) =>
            currentReports.map((report) =>
                report.id === reportId ? { ...report, label: label || report.label } : report,
            ),
        );
    };

    const activeBaseline = visibleReports.find((report) => report.id === baselineReportId) ?? visibleReports[0] ?? null;

    return (
        <div className="app-shell">
            <header className="hero">
                <div>
                    <p className="eyebrow">Testing Utils</p>
                    <h1>Eval Report Explorer</h1>
                    <p className="hero-copy">
                        Compare multiple aggregated eval reports against a baseline and surface regressions in pass
                        rate, token cost, step count, and latency.
                    </p>
                </div>
                <div className="hero-stat">
                    <span>Reports loaded</span>
                    <strong>{loadedReports.length}</strong>
                </div>
            </header>

            <ExplorerControls
                baselineReportId={baselineReportId}
                filters={filters}
                loadedReports={loadedReports}
                visibleReportIds={visibleReportIds}
                visibleReports={visibleReports}
                onBaselineChange={setBaselineReportId}
                onDrop={onDrop}
                onFileInput={onFileInput}
                onFilterChange={setFilters}
                onToggleVisibleReport={onToggleVisibleReport}
                onUpdateReportLabel={onUpdateReportLabel}
            />

            <ImportErrors errors={loadErrors} />
            <ReportSummaryGrid summaries={reportSummaries} baselineReportId={baselineReportId} />

            <section className="content-grid">
                <CaseComparisonTable
                    activeBaseline={activeBaseline}
                    filteredRows={filteredRows}
                    selectedCaseId={selectedRow?.caseId ?? ''}
                    onSelectCase={setSelectedCaseId}
                />
                <CaseDetailPanel baselineReportId={baselineReportId} selectedRow={selectedRow} />
            </section>
        </div>
    );
}
