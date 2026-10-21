import type { AnalysisRecord } from '@tomtom-org/maps-sdk-plugin-agent-toolkit';
import { useMemo } from 'react';
import { AnalysisChart } from '../../../chat';
import { type Agent, useAgentSnapshot } from '../useAgentSnapshot';
import { PanelShell } from './PanelShell';

type AnalysesPanelProps = { agent: Agent };

// Compact one-line JSON preview for non-chart (JSON) analyses — the full value also lands in the chat.
const previewJson = (data: unknown): string => {
    try {
        const text = JSON.stringify(data);
        return text.length > 280 ? `${text.slice(0, 280)}…` : text;
    } catch {
        return String(data);
    }
};

/**
 * Combined, cross-entry view of every analysis in the session — the same set the per-entry details
 * surface, read here straight off the top-level `state.analyses` registry. Re-renders on every
 * `analysis-change` (create / recompute), so monitored analyses stay live without per-entry plumbing.
 */
export function AnalysesPanel({ agent }: AnalysesPanelProps) {
    const analyses = useAgentSnapshot(
        useMemo(() => [{ events: agent.state.analyses.events, types: ['analysis-change'] }], [agent]),
        () => agent.state.analyses.all(),
    );

    if (analyses.length === 0) {
        return (
            <PanelShell title="Analyses" hint="Every analysis created by analyseData, across all entries.">
                <p className="m-0 text-[11px] text-(--ui-text-low-em)">
                    No analyses yet. Ask the agent to analyse one of your entries.
                </p>
            </PanelShell>
        );
    }

    return (
        <PanelShell title="Analyses" hint="Every analysis created by analyseData, across all entries.">
            <ul className="flex flex-col gap-2">
                {analyses.map((record: AnalysisRecord) => {
                    const latest = record.history.at(-1);
                    return (
                        <li
                            key={record.analysisId}
                            className="flex flex-col gap-1.5 rounded-(--ui-rounded-10) border border-(--ui-border-low-em) bg-(--ui-surface-1) p-3"
                        >
                            <header className="flex items-center justify-between gap-2">
                                <strong className="min-w-0 flex-1 truncate text-[13px] font-semibold text-(--ui-text-high-em)">
                                    {record.name}
                                </strong>
                                {agent.state.analyses.isMonitored(record.analysisId) && (
                                    <span className="shrink-0 rounded-full bg-(--ui-surface-brand-red) px-2 py-0.5 text-[9px] font-medium text-white">
                                        monitored
                                    </span>
                                )}
                            </header>
                            {record.description && (
                                <span className="text-[11px] text-(--ui-text-low-em)">{record.description}</span>
                            )}
                            <div className="flex flex-wrap gap-1" aria-label="Source entries">
                                {record.affectedEntryIds.map((id) => (
                                    <span
                                        key={id}
                                        className="truncate rounded-(--ui-rounded-5) bg-(--ui-surface-2) px-1.5 py-0.5 font-mono text-[10px] text-(--ui-text-med-em)"
                                        title={id}
                                    >
                                        {id}
                                    </span>
                                ))}
                            </div>
                            {record.outputFormat === 'chart' && latest ? (
                                <AnalysisChart config={latest.data} />
                            ) : (
                                <pre className="m-0 overflow-x-auto whitespace-pre-wrap break-words rounded-(--ui-rounded-5) bg-(--ui-surface-0) p-2 font-mono text-[10px] text-(--ui-text-med-em)">
                                    {latest ? previewJson(latest.data) : 'No result yet.'}
                                </pre>
                            )}
                        </li>
                    );
                })}
            </ul>
        </PanelShell>
    );
}
