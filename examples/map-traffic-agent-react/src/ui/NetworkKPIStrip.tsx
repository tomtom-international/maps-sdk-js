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
        <div className="flex flex-col gap-2 rounded-(--sdk-radius-10) border border-(--sdk-border-low) bg-(--sdk-surface-0) px-3 py-2 text-(--sdk-text-high) shadow-(--sdk-shadow-e4) backdrop-blur-md">
            <div
                className="truncate text-(--sdk-font-caption-s) font-semibold uppercase tracking-wider text-(--sdk-text-low)"
                title={label ?? ''}
            >
                {total > 0 ? (label ?? 'Network snapshot') : 'No incidents loaded'}
            </div>
            <div className="grid grid-cols-7 gap-2">
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
            <div
                className="flex h-1 gap-px overflow-hidden rounded-sm bg-(--sdk-surface-1)"
                role="img"
                aria-label="severity distribution"
            >
                {['indefinite', 'major', 'moderate', 'minor', 'unknown'].map((k) => {
                    const v = severity[k] ?? 0;
                    if (v === 0) return null;
                    const width = total > 0 ? (v / total) * 100 : 0;
                    return (
                        <span
                            key={k}
                            className="block h-full"
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
    // Static classNames so Tailwind's scanner picks every combination up.
    const stateClass = warn
        ? 'bg-[color-mix(in_srgb,hsl(0,100%,34%)_10%,var(--sdk-surface-0))] border-[color-mix(in_srgb,hsl(0,100%,34%)_35%,var(--sdk-border-low))] text-[hsl(0,80%,30%)]'
        : emphasis
          ? 'bg-[color-mix(in_srgb,var(--sdk-primary-color)_12%,var(--sdk-surface-0))] border-[color-mix(in_srgb,var(--sdk-primary-color)_40%,var(--sdk-border-low))]'
          : 'bg-(--sdk-surface-1) border-(--sdk-border-low)';
    return (
        <div className={`rounded-(--sdk-radius-5) border px-2 py-1.5 text-center transition-colors ${stateClass}`}>
            <div className="text-(--sdk-font-body-l) font-semibold leading-tight">{value}</div>
            <div className="mt-0.5 text-[10px] uppercase tracking-wider text-(--sdk-text-low)">{label}</div>
        </div>
    );
}
