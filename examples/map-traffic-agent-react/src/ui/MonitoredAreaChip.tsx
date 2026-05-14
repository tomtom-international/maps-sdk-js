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

const CHIP_CLASS =
    'inline-flex max-w-full flex-wrap items-center gap-2 rounded-full border border-[var(--sdk-border-low,rgba(0,0,0,0.08))] bg-[var(--sdk-surface-0,#fff)] px-3 py-[0.35rem] text-[12px] leading-[1.2] shadow-[var(--sdk-shadow-e2,0_1px_2px_rgba(0,0,0,0.06))] backdrop-blur-md';

export function MonitoredAreaChip({ label, lastAnalysisAt, snapshotCount, onClear }: MonitoredAreaChipProps) {
    // formatAge is computed at render time — without this tick the displayed age would freeze
    // between monitor ticks (60s) and look misleadingly fresh.
    const [, setNow] = useState(0);
    useEffect(() => {
        if (!label || lastAnalysisAt == null) return;
        const id = setInterval(() => setNow((n) => n + 1), 1000);
        return () => clearInterval(id);
    }, [label, lastAnalysisAt]);

    if (!label) {
        return (
            <div className={CHIP_CLASS} aria-live="polite">
                <span className="h-2 w-2 rounded-full bg-[#bbb]" />
                <span>No area monitored</span>
                <span className="opacity-65">Ask the agent to show incidents in an area.</span>
            </div>
        );
    }
    return (
        <div className={CHIP_CLASS} aria-live="polite">
            <span className="h-2 w-2 rounded-full bg-[#1ca372]" />
            <span>{label}</span>
            <span className="opacity-65">
                {lastAnalysisAt != null ? `last analysis ${formatAge(lastAnalysisAt)}` : 'no analysis yet'} ·{' '}
                {snapshotCount} snapshots
            </span>
            <button
                type="button"
                className="cursor-pointer border-0 bg-transparent px-[0.35rem] py-0 font-inherit text-inherit opacity-65 hover:opacity-100"
                onClick={onClear}
                aria-label="Stop monitoring"
            >
                Clear
            </button>
        </div>
    );
}
