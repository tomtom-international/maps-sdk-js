import type { TrafficIncident } from '@tomtom-org/maps-sdk/core';
import { useMemo, useState } from 'react';
import { useIncidentAddresses } from '../hooks/useIncidentAddresses';
import { formatDelay } from '../utils/format';
import { formatEndpoints } from '../utils/incidentLocation';
import { PanelCard, SeverityDot } from './components';
import { severityColor } from './lib/severity';

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
    // Fills in addresses (via reverse geocoding) for incidents that have no road/street label —
    // common for on-route corridor incidents.
    const addresses = useIncidentAddresses(incidents);

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

    return (
        <PanelCard
            aria-label="Incidents"
            title="Incidents"
            count={incidents.length}
            className="w-[280px] max-w-full max-h-[60vh]"
        >
            <div className="flex min-h-0 flex-1 flex-col">
                <div className="flex shrink-0 gap-0.5 border-b border-(--ui-border-low-em) p-1" role="tablist">
                    <TabButton active={tab === 'incidents'} onClick={() => setTab('incidents')}>
                        Incidents
                    </TabButton>
                    <TabButton active={tab === 'roads'} onClick={() => setTab('roads')}>
                        Roads
                        <span className="rounded-[8px] bg-(--ui-surface-2) px-1.5 py-px text-[10px] font-normal text-(--ui-text-low-em)">
                            {topRoads.length}
                        </span>
                    </TabButton>
                </div>

                {tab === 'incidents' && (
                    <>
                        <div className="flex flex-wrap items-center gap-1 border-b border-(--ui-border-low-em) px-3 py-2">
                            <SelectLabel label="Sort">
                                <select
                                    value={sortKey}
                                    onChange={(e) => setSortKey(e.target.value as SortKey)}
                                    className="rounded-(--ui-rounded-5) border border-(--ui-border-low-em) bg-(--ui-surface-1) px-1.5 py-1 font-(family-name:--ui-font-gilroy) text-(--ui-font-caption-m) font-normal normal-case tracking-normal text-(--ui-text-high-em)"
                                >
                                    <option value="delay">Delay</option>
                                    <option value="severity">Severity</option>
                                    <option value="recent">Recency</option>
                                </select>
                            </SelectLabel>
                            <SelectLabel label="Category">
                                <select
                                    value={categoryFilter}
                                    onChange={(e) => setCategoryFilter(e.target.value as string | 'all')}
                                    className="rounded-(--ui-rounded-5) border border-(--ui-border-low-em) bg-(--ui-surface-1) px-1.5 py-1 font-(family-name:--ui-font-gilroy) text-(--ui-font-caption-m) font-normal normal-case tracking-normal text-(--ui-text-high-em)"
                                >
                                    {categories.map((c) => (
                                        <option key={c} value={c}>
                                            {c}
                                        </option>
                                    ))}
                                </select>
                            </SelectLabel>
                            {focusedIds.size > 0 ? (
                                <button
                                    type="button"
                                    title="Clear focus"
                                    onClick={onClearFocus}
                                    className="ml-auto cursor-pointer self-end rounded-(--ui-rounded-5) border border-(--ui-border-low-em) bg-(--ui-surface-1) px-2.5 py-1.5 text-(--ui-font-caption-m) font-semibold text-(--ui-text-med-em) hover:border-(--ui-border-high-em) hover:text-(--ui-text-high-em)"
                                >
                                    Clear focus
                                </button>
                            ) : (
                                sorted.length >= 3 && (
                                    <button
                                        type="button"
                                        title="Focus top 3"
                                        onClick={() =>
                                            onFocusMany(
                                                sorted.slice(0, 3).map((f) => f.properties.id),
                                                'Top 3 by delay',
                                            )
                                        }
                                        className="ml-auto cursor-pointer self-end rounded-(--ui-rounded-5) border-0 bg-(--ui-surface-brand-red) px-2.5 py-1.5 text-(--ui-font-caption-m) font-semibold text-(--ui-text-white) hover:brightness-110"
                                    >
                                        Focus top 3
                                    </button>
                                )
                            )}
                        </div>
                        <ol className="m-0 min-h-0 flex-1 list-none overflow-y-auto p-0">
                            {sorted.map((f) => {
                                const p = f.properties;
                                const isFocused = focusedIds.has(p.id);
                                const delay = p.delayInSeconds ?? 0;
                                const geo = addresses.get(p.id);
                                const location = formatEndpoints(p.from ?? geo?.from, p.to ?? geo?.to);
                                const hasLocation = location !== '—';
                                return (
                                    <li
                                        key={p.id}
                                        role="button"
                                        tabIndex={0}
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
                                        className={`grid cursor-pointer grid-cols-[10px_1fr_auto] items-center gap-2 border-b border-(--ui-border-low-em) py-2 transition-colors hover:bg-(--ui-surface-1) focus-visible:outline focus-visible:outline-2 focus-visible:-outline-offset-2 focus-visible:outline-(--ui-surface-brand-red) ${isFocused ? 'border-l-[3px] border-l-(--ui-surface-brand-red) bg-[color-mix(in_srgb,var(--ui-surface-brand-red)_10%,var(--ui-surface-0))] pl-[calc(var(--ui-space-3)-3px)] pr-3' : 'px-3'}`}
                                    >
                                        <SeverityDot
                                            color={severityColor(p.magnitudeOfDelay)}
                                            title={p.magnitudeOfDelay}
                                        />
                                        <div className="min-w-0">
                                            {/* Title is the location; the incident type is the subtitle. */}
                                            <div className="flex items-baseline gap-1.5 text-(--ui-font-body-s) font-semibold">
                                                <span
                                                    className={`truncate text-(--ui-text-high-em) ${hasLocation ? '' : 'capitalize'}`}
                                                >
                                                    {hasLocation ? location : p.category}
                                                </span>
                                                {p.roadNumbers?.[0] && (
                                                    <span className="shrink-0 rounded-[3px] bg-(--ui-surface-2) px-1.5 py-px text-[10px] uppercase tracking-wider text-(--ui-text-med-em)">
                                                        {p.roadNumbers[0]}
                                                    </span>
                                                )}
                                            </div>
                                            {hasLocation && (
                                                <div className="mt-0.5 truncate text-(--ui-font-caption-s) capitalize text-(--ui-text-low-em)">
                                                    {p.category}
                                                </div>
                                            )}
                                        </div>
                                        <div className="whitespace-nowrap text-right text-(--ui-font-body-s) font-semibold text-(--ui-text-high-em) [font-variant-numeric:tabular-nums]">
                                            {delay > 0 ? formatDelay(delay) : '—'}
                                        </div>
                                    </li>
                                );
                            })}
                        </ol>
                    </>
                )}

                {tab === 'roads' && (
                    <ol className="m-0 flex-1 list-none overflow-y-auto p-0">
                        {topRoads.length === 0 ? (
                            <li className="p-3 text-center text-(--ui-font-caption-m) text-(--ui-text-low-em)">
                                No road numbers on current incidents.
                            </li>
                        ) : (
                            topRoads.map((r) => (
                                <li
                                    key={r.road}
                                    role="button"
                                    tabIndex={0}
                                    onClick={() => onFocusMany(r.ids, `On ${r.road}`)}
                                    onKeyDown={(e) => {
                                        if (e.key === 'Enter' || e.key === ' ') {
                                            e.preventDefault();
                                            onFocusMany(r.ids, `On ${r.road}`);
                                        }
                                    }}
                                    title={`Focus ${r.ids.length} incidents on ${r.road}`}
                                    className="grid cursor-pointer grid-cols-[60px_1fr_auto] items-center gap-2 border-b border-(--ui-border-low-em) px-3 py-2 transition-colors hover:bg-(--ui-surface-1) focus-visible:outline focus-visible:outline-2 focus-visible:-outline-offset-2 focus-visible:outline-(--ui-surface-brand-red)"
                                >
                                    <span className="text-(--ui-font-body-s) font-semibold uppercase tracking-wider text-(--ui-text-high-em)">
                                        {r.road}
                                    </span>
                                    <span className="relative min-w-[30px] h-2.5 overflow-hidden rounded-[3px] bg-(--ui-surface-2)">
                                        <span
                                            className="block h-full rounded-[3px] bg-gradient-to-r from-[hsl(45,100%,51%)] via-[hsl(9,97%,51%)] to-[hsl(0,100%,34%)]"
                                            style={{ width: `${r.barPct}%` }}
                                        />
                                    </span>
                                    <span className="flex flex-col items-end [font-variant-numeric:tabular-nums]">
                                        <strong className="text-(--ui-font-body-s) text-(--ui-text-high-em)">
                                            {formatDelay(r.totalDelay)}
                                        </strong>
                                        <span className="text-[10px] text-(--ui-text-low-em)">· {r.ids.length}</span>
                                    </span>
                                </li>
                            ))
                        )}
                    </ol>
                )}
            </div>
        </PanelCard>
    );
}

function TabButton({ active, onClick, children }: { active: boolean; onClick: () => void; children: React.ReactNode }) {
    const activeClass = active
        ? 'bg-(--ui-surface-0) text-(--ui-text-high-em) shadow-(--ui-elevation-e1)'
        : 'bg-transparent text-(--ui-text-med-em) hover:text-(--ui-text-high-em)';
    return (
        <button
            type="button"
            role="tab"
            aria-selected={active}
            onClick={onClick}
            className={`inline-flex flex-1 cursor-pointer items-center justify-center gap-1.5 rounded-(--ui-rounded-5) border-0 px-2 py-1.5 text-(--ui-font-caption-m) font-semibold ${activeClass}`}
        >
            {children}
        </button>
    );
}

function SelectLabel({ label, children }: { label: string; children: React.ReactNode }) {
    return (
        <label className="inline-flex min-w-0 flex-1 flex-col gap-0.5 text-[10px] font-semibold uppercase tracking-wider text-(--ui-text-low-em)">
            <span>{label}</span>
            {children}
        </label>
    );
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
