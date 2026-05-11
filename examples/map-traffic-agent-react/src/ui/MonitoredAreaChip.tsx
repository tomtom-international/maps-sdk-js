import { useEffect, useState } from 'react';

export type MonitoredAreaChipProps = {
    label: string | null;
    lastAnalysisAt: number | null;
    snapshotCount: number;
    onClear: () => void;
};

function formatAge(ms: number | null): string {
    if (ms === null) return '—';
    const secs = Math.max(0, Math.floor((Date.now() - ms) / 1000));
    if (secs < 60) return `${secs}s ago`;
    return `${Math.floor(secs / 60)}m ago`;
}

export function MonitoredAreaChip({ label, lastAnalysisAt, snapshotCount, onClear }: MonitoredAreaChipProps) {
    // formatAge is computed at render time — without this tick the displayed age would
    // freeze between monitor ticks (60s) and look misleadingly fresh. The interval also
    // surfaces background-tab throttling: when the browser delays our setInterval past
    // 60s, the age keeps climbing visibly so the staleness isn't hidden.
    const [, setNow] = useState(0);
    useEffect(() => {
        if (!label || lastAnalysisAt == null) return;
        const id = setInterval(() => setNow((n) => n + 1), 1000);
        return () => clearInterval(id);
    }, [label, lastAnalysisAt]);
    if (!label) {
        return (
            <div className="monitor-chip monitor-chip--idle" aria-live="polite">
                <span className="monitor-chip__dot monitor-chip__dot--idle" />
                <span className="monitor-chip__label">No area monitored</span>
                <span className="monitor-chip__hint">Ask the agent to show incidents in an area.</span>
            </div>
        );
    }
    return (
        <div className="monitor-chip monitor-chip--running" aria-live="polite">
            <span className="monitor-chip__dot monitor-chip__dot--running" />
            <span className="monitor-chip__label">{label}</span>
            <span className="monitor-chip__meta">
                {lastAnalysisAt != null ? `last analysis ${formatAge(lastAnalysisAt)}` : 'no analysis yet'} ·{' '}
                {snapshotCount} snapshots
            </span>
            <button type="button" className="monitor-chip__clear" onClick={onClear} aria-label="Stop monitoring">
                Clear
            </button>
        </div>
    );
}
