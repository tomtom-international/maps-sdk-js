import type { TrafficIncident } from '@tomtom-org/maps-sdk/core';

export type NetworkKPIStripProps = {
    incidents: readonly TrafficIncident[];
    label?: string;
};

const SEVERITY_COLOR: Record<string, string> = {
    unknown: 'hsl(198, 20%, 54%)',
    minor: 'hsl(45, 100%, 51%)',
    moderate: 'hsl(9, 97%, 51%)',
    major: 'hsl(0, 100%, 34%)',
    indefinite: 'hsl(0, 90%, 26%)',
};

export function NetworkKPIStrip({ incidents, label }: NetworkKPIStripProps) {
    const total = incidents.length;
    const severity: Record<string, number> = {};
    let totalDelay = 0;
    let closures = 0;
    let jams = 0;
    let roadworks = 0;
    const roads = new Set<string>();

    for (const f of incidents) {
        const p = f.properties;
        severity[p.magnitudeOfDelay] = (severity[p.magnitudeOfDelay] ?? 0) + 1;
        totalDelay += p.delayInSeconds ?? 0;
        if (p.category === 'road-closed' || p.category === 'lane-closed') closures += 1;
        if (p.category === 'jam') jams += 1;
        if (p.category === 'roadworks') roadworks += 1;
        for (const r of p.roadNumbers ?? []) roads.add(r);
    }

    const totalDelayMinutes = Math.round(totalDelay / 60);
    const majorPlusIndef = (severity.major ?? 0) + (severity.indefinite ?? 0);

    return (
        <div className="kpi-strip">
            <div className="kpi-strip-label" title={label ?? ''}>
                {total > 0 ? (label ?? 'Network snapshot') : 'No incidents loaded'}
            </div>
            <div className="kpi-strip-grid">
                <Kpi label="Incidents" value={total.toString()} />
                <Kpi
                    label="Delay Σ"
                    value={
                        totalDelayMinutes >= 60
                            ? `${Math.floor(totalDelayMinutes / 60)}h ${totalDelayMinutes % 60}m`
                            : `${totalDelayMinutes}m`
                    }
                    emphasis={totalDelay > 0}
                />
                <Kpi label="Major+" value={majorPlusIndef.toString()} emphasis={majorPlusIndef > 0} warn />
                <Kpi label="Closures" value={closures.toString()} warn={closures > 0} />
                <Kpi label="Jams" value={jams.toString()} />
                <Kpi label="Roadworks" value={roadworks.toString()} />
                <Kpi label="Roads" value={roads.size.toString()} />
            </div>
            <div className="kpi-strip-severity" role="img" aria-label="severity distribution">
                {['indefinite', 'major', 'moderate', 'minor', 'unknown'].map((k) => {
                    const v = severity[k] ?? 0;
                    if (v === 0) return null;
                    const width = total > 0 ? (v / total) * 100 : 0;
                    return (
                        <span
                            key={k}
                            className="kpi-strip-severity-segment"
                            title={`${k}: ${v}`}
                            style={{ width: `${width}%`, background: SEVERITY_COLOR[k] }}
                        />
                    );
                })}
            </div>
        </div>
    );
}

function Kpi({ label, value, emphasis, warn }: { label: string; value: string; emphasis?: boolean; warn?: boolean }) {
    const cls = ['kpi-strip-cell', emphasis ? 'is-emphasis' : '', warn ? 'is-warn' : ''].filter(Boolean).join(' ');
    return (
        <div className={cls}>
            <div className="kpi-strip-value">{value}</div>
            <div className="kpi-strip-label-sm">{label}</div>
        </div>
    );
}
