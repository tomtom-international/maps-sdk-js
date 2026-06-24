import type { AnalysisRecord } from '@tomtom-org/maps-sdk-plugin-agent-toolkit';
import { useState } from 'react';
import { AnalysisChart } from '../chat';

export type AnalysesPanelProps = {
    analyses: readonly AnalysisRecord[];
    onToggleMonitor: (analysisId: string, enabled: boolean) => void;
};

// Shared chrome; only the outer geometry differs between docked (right rail) and expanded
// (overlay covering the map). Same DOM either way — no duplicated content.
const PANEL_CHROME =
    'flex flex-col overflow-hidden rounded-(--sdk-radius-10) border border-(--sdk-border-low) bg-(--sdk-surface-0) shadow-(--sdk-shadow-e4) backdrop-blur-md';
const DOCKED = 'max-h-[70%] shrink-0';
// `absolute inset-2` is relative to the map overlay grid (the nearest positioned ancestor lives
// inside #sdk-map), so the panel fills the map area while the chat column stays interactive.
const EXPANDED = 'absolute inset-2 z-20';

/**
 * Right-rail panel listing the agent's registered analyses (from analyseData), each rendered with
 * its latest result — a chart when `outputFormat: 'chart'`, otherwise a compact JSON readout.
 * A header toggle expands the SAME panel into a large overlay over the map (bigger charts) and back,
 * leaving the chat fully usable.
 */
export function AnalysesPanel({ analyses, onToggleMonitor }: AnalysesPanelProps) {
    const [expanded, setExpanded] = useState(false);
    if (analyses.length === 0) return null;
    return (
        <section aria-label="Agent analyses" className={`${PANEL_CHROME} ${expanded ? EXPANDED : DOCKED}`}>
            <header className="flex shrink-0 items-center gap-2 border-b border-(--sdk-border-low) bg-gradient-to-r from-[hsla(200,70%,55%,0.12)] to-[hsla(160,70%,50%,0.06)] px-3 py-2">
                <h3 className="m-0 flex-auto text-sm font-semibold text-(--sdk-text-high)">Analyses</h3>
                <span className="rounded-full border border-(--sdk-border-low) bg-(--sdk-surface-1) px-2 py-0.5 text-[11px] font-semibold text-(--sdk-text-medium)">
                    {analyses.length}
                </span>
                <button
                    type="button"
                    title={expanded ? 'Collapse to the side' : 'Expand over the map'}
                    aria-label={expanded ? 'Collapse analyses panel' : 'Expand analyses panel'}
                    aria-pressed={expanded}
                    onClick={() => setExpanded((v) => !v)}
                    className="flex h-[22px] w-[22px] cursor-pointer items-center justify-center rounded border-0 bg-transparent p-0 text-[14px] leading-none text-(--sdk-text-medium) hover:bg-(--sdk-surface-1) hover:text-(--sdk-text-high)"
                >
                    {expanded ? '✕' : '⤢'}
                </button>
            </header>
            <ol className="m-0 flex-auto list-none overflow-y-auto p-0">
                {analyses.map((record) => (
                    <AnalysisItem
                        key={record.analysisId}
                        record={record}
                        expanded={expanded}
                        onToggleMonitor={onToggleMonitor}
                    />
                ))}
            </ol>
        </section>
    );
}

function AnalysisItem({
    record,
    expanded,
    onToggleMonitor,
}: {
    record: AnalysisRecord;
    expanded: boolean;
    onToggleMonitor: (analysisId: string, enabled: boolean) => void;
}) {
    const latest = record.history.at(-1);
    const description = record.description ?? latest?.description;
    const isChart = (latest?.outputFormat ?? record.outputFormat) === 'chart';

    return (
        <li className="flex flex-col gap-1.5 border-b border-(--sdk-border-low) px-3 py-2">
            <div className="flex items-center gap-2">
                <h4 className="m-0 flex-auto text-[13px] font-semibold leading-snug text-(--sdk-text-high)">
                    {record.name}
                </h4>
                <button
                    type="button"
                    title={record.enabled ? 'Monitoring — click to stop' : 'Not monitoring — click to start'}
                    aria-pressed={record.enabled}
                    onClick={() => onToggleMonitor(record.analysisId, !record.enabled)}
                    className={`cursor-pointer rounded border-0 px-1.5 py-0.5 text-[9px] font-semibold tracking-wider ${
                        record.enabled
                            ? 'bg-gradient-to-r from-[hsl(200,70%,50%)] to-[hsl(160,70%,45%)] text-white'
                            : 'bg-(--sdk-surface-1) text-(--sdk-text-medium)'
                    }`}
                >
                    {record.enabled ? 'LIVE' : 'OFF'}
                </button>
            </div>
            {description && <p className="m-0 text-[11px] leading-snug text-(--sdk-text-low)">{description}</p>}
            {latest ? (
                isChart ? (
                    <AnalysisChart config={latest.data} expanded={expanded} />
                ) : (
                    <pre className="m-0 max-h-40 overflow-auto rounded bg-(--sdk-surface-1) p-2 text-[11px] leading-snug text-(--sdk-text-medium) [font-variant-numeric:tabular-nums]">
                        {safeStringify(latest.data)}
                    </pre>
                )
            ) : (
                <p className="m-0 text-[11px] text-(--sdk-text-low)">No result yet.</p>
            )}
        </li>
    );
}

const safeStringify = (value: unknown): string => {
    try {
        return JSON.stringify(value, null, 2);
    } catch {
        return String(value);
    }
};
