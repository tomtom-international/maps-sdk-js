import type { TrafficIncident } from '@tomtom-org/maps-sdk/core';
import { useEffect, useMemo, useState } from 'react';
import { captionStyle, KpiTile, PanelCard } from './components';
import { playbook } from './lib/playbook-tokens';
import { severityColor } from './lib/severity';
import { formatDelayTerse, relativeAge } from './lib/time';

export type NetworkKPIStripProps = {
    incidents: readonly TrafficIncident[];
    label?: string;
    /** True when the summarised area has a live background monitor — drives the header live dot
     *  and the "updated Ns ago" status line (merged in from the former standalone MonitorChip). */
    monitored?: boolean;
    /** Timestamp of the monitor's last refresh, for the "updated Ns ago" age. */
    lastAnalysisAt?: number | null;
    /** Number of snapshots the monitor has captured, shown as "· N" when > 0. */
    snapshotCount?: number;
};

/**
 * The "Current viewport / Summary" card. A titled overlay card over a
 * 2-column grid of KPI tiles: the headline totals (Incidents, Delay Σ) in the brand-red emphasis tone,
 * the breakdown (Major+, Closures, Jams, Roadworks) in the info-blue tone, with a severity-mix bar
 * underneath. When the area is monitored, the header carries a live dot and the monitor's refresh
 * age + snapshot count.
 */
export function NetworkKPIStrip({
    incidents,
    label,
    monitored = false,
    lastAnalysisAt,
    snapshotCount = 0,
}: NetworkKPIStripProps) {
    // Tick once a second so the "updated Ns ago" age advances between the monitor's 60s refreshes.
    const [, setNow] = useState(0);
    useEffect(() => {
        if (!monitored) return;
        const id = setInterval(() => setNow((n) => n + 1), 1000);
        return () => clearInterval(id);
    }, [monitored]);

    // Aggregate once per incident set — not on every 1s "updated Ns ago" tick.
    const { total, severity, delayLabel, majorPlusIndef, closures, jams, roadworks } = useMemo(() => {
        const sev: Record<string, number> = {};
        let totalDelay = 0;
        let cl = 0;
        let jm = 0;
        let rw = 0;
        for (const f of incidents) {
            const p = f.properties;
            sev[p.magnitudeOfDelay] = (sev[p.magnitudeOfDelay] ?? 0) + 1;
            totalDelay += p.delayInSeconds ?? 0;
            if (p.category === 'road-closed' || p.category === 'lane-closed') cl += 1;
            if (p.category === 'jam') jm += 1;
            if (p.category === 'roadworks') rw += 1;
        }
        return {
            total: incidents.length,
            severity: sev,
            delayLabel: formatDelayTerse(totalDelay),
            majorPlusIndef: (sev.major ?? 0) + (sev.indefinite ?? 0),
            closures: cl,
            jams: jm,
            roadworks: rw,
        };
    }, [incidents]);

    const titleText = label?.trim() || 'Current viewport';
    const titleNode = monitored ? (
        <span className="flex min-w-0 items-center gap-2">
            <span className="h-2 w-2 shrink-0 rounded-full" style={{ background: playbook.status.success }} />
            <span className="truncate">{titleText}</span>
        </span>
    ) : (
        titleText
    );
    const headerMeta = monitored ? (
        <span className="text-[12px] leading-[1.2] text-(--pb-text-low)" aria-live="polite">
            {lastAnalysisAt != null ? `updated ${relativeAge(lastAnalysisAt)}` : 'no data yet'}
            {snapshotCount > 0 ? ` · ${snapshotCount}` : ''}
        </span>
    ) : undefined;

    return (
        <PanelCard
            aria-label="Current viewport summary"
            title={titleNode}
            headerMeta={headerMeta}
            className="w-[280px] max-w-full"
        >
            <div className="flex flex-col gap-2 px-3 pt-2 pb-3">
                <div style={captionStyle} className="font-semibold uppercase tracking-wide">
                    Summary
                </div>
                <div className="grid grid-cols-2 gap-2">
                    <KpiTile label="Incidents" value={total} tone="error" />
                    <KpiTile label="Delay Σ" value={delayLabel} tone="error" />
                    <KpiTile label="Major+" value={majorPlusIndef} tone="info" />
                    <KpiTile label="Closures" value={closures} tone="info" />
                    <KpiTile label="Jams" value={jams} tone="info" />
                    <KpiTile label="Roadworks" value={roadworks} tone="info" />
                </div>
                {total > 0 && (
                    <div
                        className="flex h-1 gap-px overflow-hidden rounded-sm"
                        role="img"
                        aria-label="severity distribution"
                        style={{ background: playbook.surface.surface1 }}
                    >
                        {['indefinite', 'major', 'moderate', 'minor', 'unknown'].map((k) => {
                            const v = severity[k] ?? 0;
                            if (v === 0) return null;
                            return (
                                <span
                                    key={k}
                                    className="block h-full"
                                    title={`${k}: ${v}`}
                                    style={{ width: `${(v / total) * 100}%`, background: severityColor(k) }}
                                />
                            );
                        })}
                    </div>
                )}
            </div>
        </PanelCard>
    );
}
