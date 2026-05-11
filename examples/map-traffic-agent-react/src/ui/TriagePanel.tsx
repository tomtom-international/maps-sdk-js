import type { TrafficIncident } from '@tomtom-org/maps-sdk/core';
import { useMemo, useState } from 'react';

export type TriagePanelProps = {
    incidents: readonly TrafficIncident[];
    focusedIds: ReadonlySet<string>;
    onFocusIncident: (id: string) => void;
    onSelectIncident: (id: string) => void;
    onFocusMany: (ids: string[], reason: string) => void;
    onClearFocus: () => void;
};

type Tab = 'incidents' | 'roads';
type SortKey = 'delay' | 'severity' | 'recent';

const SEVERITY_ORDER: Record<string, number> = {
    indefinite: 4,
    major: 3,
    moderate: 2,
    minor: 1,
    unknown: 0,
};

const SEVERITY_COLOR: Record<string, string> = {
    unknown: 'hsl(198, 20%, 54%)',
    minor: 'hsl(45, 100%, 51%)',
    moderate: 'hsl(9, 97%, 51%)',
    major: 'hsl(0, 100%, 34%)',
    indefinite: 'hsl(0, 90%, 26%)',
};

export function TriagePanel({
    incidents,
    focusedIds,
    onFocusIncident,
    onSelectIncident,
    onFocusMany,
    onClearFocus,
}: TriagePanelProps) {
    const [tab, setTab] = useState<Tab>('incidents');
    const [sortKey, setSortKey] = useState<SortKey>('delay');
    const [categoryFilter, setCategoryFilter] = useState<string | 'all'>('all');
    const [open, setOpen] = useState(true);

    const categories = useMemo(() => {
        const set = new Set<string>();
        for (const f of incidents) set.add(f.properties.category);
        return ['all' as const, ...[...set].sort()];
    }, [incidents]);

    const sorted = useMemo(() => {
        const filtered =
            categoryFilter === 'all' ? incidents : incidents.filter((f) => f.properties.category === categoryFilter);
        return [...filtered].sort((a, b) => {
            if (sortKey === 'delay') {
                return (b.properties.delayInSeconds ?? 0) - (a.properties.delayInSeconds ?? 0);
            }
            if (sortKey === 'severity') {
                return (
                    (SEVERITY_ORDER[b.properties.magnitudeOfDelay] ?? 0) -
                    (SEVERITY_ORDER[a.properties.magnitudeOfDelay] ?? 0)
                );
            }
            const aT = a.properties.lastReportTime ?? a.properties.startTime;
            const bT = b.properties.lastReportTime ?? b.properties.startTime;
            return (bT ? +bT : 0) - (aT ? +aT : 0);
        });
    }, [incidents, sortKey, categoryFilter]);

    const topRoads = useMemo(() => aggregateByRoad(incidents), [incidents]);

    if (incidents.length === 0) {
        return (
            <aside className={`triage triage-empty ${open ? '' : 'is-collapsed'}`}>
                <header className="triage-header">
                    <button
                        type="button"
                        className="triage-collapse"
                        onClick={() => setOpen((v) => !v)}
                        aria-label={open ? 'Collapse panel' : 'Expand panel'}
                    >
                        {open ? '›' : '‹'}
                    </button>
                    <h3>Triage</h3>
                </header>
                {open && (
                    <div className="triage-empty-body">
                        Ask the agent for incidents (e.g. "Show me incidents in Amsterdam"). Data will appear here
                        sorted by delay.
                    </div>
                )}
            </aside>
        );
    }

    return (
        <aside className={`triage ${open ? '' : 'is-collapsed'}`}>
            <header className="triage-header">
                <button
                    type="button"
                    className="triage-collapse"
                    onClick={() => setOpen((v) => !v)}
                    aria-label={open ? 'Collapse panel' : 'Expand panel'}
                >
                    {open ? '›' : '‹'}
                </button>
                <h3>Triage</h3>
                <span className="triage-count">{incidents.length}</span>
            </header>

            {open && (
                <>
                    <div className="triage-tabs" role="tablist">
                        <button
                            type="button"
                            role="tab"
                            aria-selected={tab === 'incidents'}
                            className={tab === 'incidents' ? 'is-active' : ''}
                            onClick={() => setTab('incidents')}
                        >
                            Incidents
                        </button>
                        <button
                            type="button"
                            role="tab"
                            aria-selected={tab === 'roads'}
                            className={tab === 'roads' ? 'is-active' : ''}
                            onClick={() => setTab('roads')}
                        >
                            Roads
                            <span className="triage-count-sm">{topRoads.length}</span>
                        </button>
                    </div>

                    {tab === 'incidents' && (
                        <>
                            <div className="triage-toolbar">
                                <label className="triage-select">
                                    <span>Sort</span>
                                    <select value={sortKey} onChange={(e) => setSortKey(e.target.value as SortKey)}>
                                        <option value="delay">Delay</option>
                                        <option value="severity">Severity</option>
                                        <option value="recent">Recency</option>
                                    </select>
                                </label>
                                <label className="triage-select">
                                    <span>Category</span>
                                    <select
                                        value={categoryFilter}
                                        onChange={(e) => setCategoryFilter(e.target.value as string | 'all')}
                                    >
                                        {categories.map((c) => (
                                            <option key={c} value={c}>
                                                {c}
                                            </option>
                                        ))}
                                    </select>
                                </label>
                                {focusedIds.size > 0 ? (
                                    <button
                                        type="button"
                                        className="triage-clear"
                                        onClick={onClearFocus}
                                        title="Clear focus"
                                    >
                                        Clear focus
                                    </button>
                                ) : (
                                    sorted.length >= 3 && (
                                        <button
                                            type="button"
                                            className="triage-top3"
                                            onClick={() =>
                                                onFocusMany(
                                                    sorted.slice(0, 3).map((f) => f.properties.id),
                                                    'Top 3 by delay',
                                                )
                                            }
                                            title="Focus top 3"
                                        >
                                            Focus top 3
                                        </button>
                                    )
                                )}
                            </div>
                            <ol className="triage-list">
                                {sorted.map((f) => {
                                    const p = f.properties;
                                    const isFocused = focusedIds.has(p.id);
                                    const delay = p.delayInSeconds ?? 0;
                                    return (
                                        <li
                                            key={p.id}
                                            className={`triage-row ${isFocused ? 'is-focused' : ''}`}
                                            onClick={() => {
                                                onFocusIncident(p.id);
                                                onSelectIncident(p.id);
                                            }}
                                            onKeyDown={(e) => {
                                                if (e.key === 'Enter' || e.key === ' ') {
                                                    e.preventDefault();
                                                    onFocusIncident(p.id);
                                                    onSelectIncident(p.id);
                                                }
                                            }}
                                            role="button"
                                            tabIndex={0}
                                        >
                                            <span
                                                className="triage-severity-dot"
                                                style={{ background: SEVERITY_COLOR[p.magnitudeOfDelay] }}
                                                title={p.magnitudeOfDelay}
                                            />
                                            <div className="triage-main">
                                                <div className="triage-title">
                                                    <span className="triage-cat">{p.category}</span>
                                                    {p.roadNumbers?.[0] && (
                                                        <span className="triage-road">{p.roadNumbers[0]}</span>
                                                    )}
                                                </div>
                                                <div className="triage-sub">
                                                    {p.from ? p.from : '—'}
                                                    {p.to ? ` → ${p.to}` : ''}
                                                </div>
                                            </div>
                                            <div className="triage-delay">{delay > 0 ? formatDelay(delay) : '—'}</div>
                                        </li>
                                    );
                                })}
                            </ol>
                        </>
                    )}

                    {tab === 'roads' && (
                        <ol className="triage-roads">
                            {topRoads.length === 0 ? (
                                <li className="triage-empty-row">No road numbers on current incidents.</li>
                            ) : (
                                topRoads.map((r) => (
                                    <li
                                        key={r.road}
                                        className="triage-road-row"
                                        onClick={() => onFocusMany(r.ids, `On ${r.road}`)}
                                        onKeyDown={(e) => {
                                            if (e.key === 'Enter' || e.key === ' ') {
                                                e.preventDefault();
                                                onFocusMany(r.ids, `On ${r.road}`);
                                            }
                                        }}
                                        role="button"
                                        tabIndex={0}
                                        title={`Focus ${r.ids.length} incidents on ${r.road}`}
                                    >
                                        <span className="triage-road-name">{r.road}</span>
                                        <span className="triage-road-bars">
                                            <span className="triage-road-bar" style={{ width: `${r.barPct}%` }} />
                                        </span>
                                        <span className="triage-road-stat">
                                            <strong>{formatDelay(r.totalDelay)}</strong>
                                            <span className="triage-road-count">· {r.ids.length}</span>
                                        </span>
                                    </li>
                                ))
                            )}
                        </ol>
                    )}
                </>
            )}
        </aside>
    );
}

function formatDelay(seconds: number): string {
    if (seconds < 60) return '<1m';
    const min = Math.round(seconds / 60);
    if (min < 60) return `${min}m`;
    const h = Math.floor(min / 60);
    const rm = min % 60;
    return rm === 0 ? `${h}h` : `${h}h${rm}m`;
}

function aggregateByRoad(
    incidents: readonly TrafficIncident[],
): Array<{ road: string; ids: string[]; totalDelay: number; barPct: number }> {
    const map = new Map<string, { ids: string[]; totalDelay: number }>();
    for (const f of incidents) {
        const r = f.properties.roadNumbers?.[0];
        if (!r) continue;
        const rec = map.get(r) ?? { ids: [], totalDelay: 0 };
        rec.ids.push(f.properties.id);
        rec.totalDelay += f.properties.delayInSeconds ?? 0;
        map.set(r, rec);
    }
    const rows = [...map.entries()]
        .map(([road, v]) => ({ road, ids: v.ids, totalDelay: v.totalDelay, barPct: 0 }))
        .sort((a, b) => b.totalDelay - a.totalDelay);
    const max = rows[0]?.totalDelay ?? 0;
    for (const r of rows) {
        r.barPct = max > 0 ? (r.totalDelay / max) * 100 : 0;
    }
    return rows;
}
