import { useState } from 'react';
import { AnalysisChart } from '../chat';
import type { AnalysisView } from '../hooks/useAnalyses';
import { cardShellClass, IconButton, MetaChip, Toggle, titleStyle } from './components';
import { playbook } from './lib/playbook-tokens';

export type AnalysesPanelProps = {
    analyses: readonly AnalysisView[];
    onToggleMonitor: (analysisId: string, enabled: boolean) => void;
};

// Shared chrome; only the outer geometry differs between docked (right rail) and expanded
// (overlay covering the map). Same DOM either way — no duplicated content.
const PANEL_CHROME = `flex flex-col overflow-hidden ${cardShellClass}`;
const DOCKED = 'w-[280px] max-w-full max-h-[70%] shrink-0';
// `absolute inset-2` is relative to the map overlay grid (the nearest positioned ancestor lives
// inside #sdk-map), so the panel fills the map area while the chat column stays interactive.
const EXPANDED = 'absolute inset-2 z-20';

// Maximize / minimize glyphs — arrows out to / in from the corners. Match the collapse
// chevron's weight (1.6 stroke, currentColor) so the header control reads as part of the set.
function ExpandGlyph() {
    return (
        <svg viewBox="0 0 16 16" width="14" height="14" fill="none" stroke="currentColor" strokeWidth="1.6">
            <path d="M6 2H2v4M10 2h4v4M6 14H2v-4M10 14h4v-4" strokeLinecap="round" strokeLinejoin="round" />
        </svg>
    );
}
function CollapseGlyph() {
    return (
        <svg viewBox="0 0 16 16" width="14" height="14" fill="none" stroke="currentColor" strokeWidth="1.6">
            <path d="M2 6h4V2M14 6h-4V2M2 10h4v4M14 10h-4v4" strokeLinecap="round" strokeLinejoin="round" />
        </svg>
    );
}

/**
 * Right-rail panel listing the agent's registered analyses (from analyseData), each rendered with
 * its latest result — a chart when `outputFormat: 'chart'`, otherwise a compact JSON readout.
 * Styled to match the overlay panels (PanelCard header, success Toggle, divider rows). A header
 * toggle expands the SAME panel into a large overlay over the map (bigger charts) and back, leaving
 * the chat fully usable.
 */
export function AnalysesPanel({ analyses, onToggleMonitor }: AnalysesPanelProps) {
    const [expanded, setExpanded] = useState(false);
    if (analyses.length === 0) return null;
    return (
        <section aria-label="Agent analyses" className={`${PANEL_CHROME} ${expanded ? EXPANDED : DOCKED}`}>
            <header
                className="flex shrink-0 items-center gap-2 px-3 py-2"
                style={{ borderBottom: `1px solid ${playbook.border.lowEm}` }}
            >
                <h2 style={titleStyle} className="m-0 min-w-0 flex-1 truncate">
                    Analyses
                </h2>
                <MetaChip>{analyses.length}</MetaChip>
                <IconButton
                    label={expanded ? 'Collapse analyses panel' : 'Expand analyses panel'}
                    onClick={() => setExpanded((v) => !v)}
                    size="sm"
                    active={expanded}
                >
                    {expanded ? <CollapseGlyph /> : <ExpandGlyph />}
                </IconButton>
            </header>
            <ol className="m-0 flex min-h-0 flex-auto list-none flex-col divide-y divide-(--pb-border-low) overflow-y-auto p-0">
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
    record: AnalysisView;
    expanded: boolean;
    onToggleMonitor: (analysisId: string, enabled: boolean) => void;
}) {
    const latest = record.history.at(-1);
    const description = record.description ?? latest?.description;
    const isChart = (latest?.outputFormat ?? record.outputFormat) === 'chart';

    return (
        <li className="flex flex-col gap-2 p-3">
            <div className="flex items-center gap-2">
                <h3 className="m-0 flex-auto text-[14px] font-bold leading-snug text-(--pb-text-high)">
                    {record.name}
                </h3>
                <Toggle
                    checked={record.monitored}
                    onChange={(next) => onToggleMonitor(record.analysisId, next)}
                    size="md"
                    tone="success"
                    title={record.monitored ? 'Monitoring — click to stop' : 'Not monitoring — click to start'}
                    labelClassName={null}
                />
            </div>
            {description && <p className="m-0 text-[12px] leading-snug text-(--pb-text-low)">{description}</p>}
            {latest ? (
                isChart ? (
                    <AnalysisChart config={latest.data} expanded={expanded} />
                ) : (
                    <pre className="m-0 max-h-40 overflow-auto rounded-(--pb-radius) bg-(--pb-surface-1) p-2 text-[11px] leading-snug text-(--pb-text-medium) [font-variant-numeric:tabular-nums]">
                        {safeStringify(latest.data)}
                    </pre>
                )
            ) : (
                <p className="m-0 text-[12px] text-(--pb-text-low)">No result yet.</p>
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
