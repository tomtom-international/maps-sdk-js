import type { Tracker, TrackerEvent } from '@tomtom-org/maps-sdk-plugin-agent-toolkit';
import { useEffect, useState } from 'react';
import type { WatchedArea } from '../hooks/useTrackers';
import { FeedRow, RailCard, Switcher, Toggle } from './components';
import { formatDelayTerse, relativeAge } from './lib/time';
import { AlertGlyph, LocateGlyph, ResolvedGlyph, TrashGlyph } from './trackerIcons';

/**
 * Re-render the panel once a second (while `active`) so relative-age lines ("since 5m ago", feed
 * timestamps) stay current. One timer for the whole rail; idles when there's nothing time-relative.
 */
function useNowTick(active: boolean) {
    const [, setTick] = useState(0);
    useEffect(() => {
        if (!active) return;
        const id = setInterval(() => setTick((n) => n + 1), 1000);
        return () => clearInterval(id);
    }, [active]);
}

export type OperationsPanelProps = {
    areas: readonly WatchedArea[];
    ungrouped: readonly Tracker[];
    trackerCount: number;
    events: readonly TrackerEvent[];
    lastSeenAt: number;
    onToggle: (trackerId: string, enabled: boolean) => void;
    onClear: (trackerId: string) => void;
    onFocusArea: (entryId: string) => void;
    onSeen: () => void;
};

type Tab = 'watching' | 'activity';

const KIND_ACCENT: Record<TrackerEvent['kind'], string> = {
    opened: 'var(--sdk-color-error)',
    resolved: 'var(--sdk-text-low)',
};

/**
 * The "Event tracker" rail — a watched-area task list + a notifications feed, multiplexed by a
 * `Switcher` inside one `RailCard` with the WATCH gradient header. The watching tab groups trackers BY
 * AREA: one card per watched traffic area, its mini-KPIs, and a click that frames the area on the map;
 * trackers nest under their area. Trackers that watch no traffic area (a non-spatial / cross-kind rule)
 * fall into an "Other trackers" group.
 */
export function OperationsPanel({
    areas,
    ungrouped,
    trackerCount,
    events,
    lastSeenAt,
    onToggle,
    onClear,
    onFocusArea,
    onSeen,
}: OperationsPanelProps) {
    const [tab, setTab] = useState<Tab>('watching');
    const unread = events.reduce((n, e) => (e.at > lastSeenAt ? n + 1 : n), 0);
    const active = trackerCount > 0 || events.length > 0;
    useNowTick(active);

    const select = (next: Tab) => {
        setTab(next);
        if (next === 'activity') onSeen();
    };

    return (
        <RailCard
            aria-label="Event tracker — watched areas and alerts"
            className="w-[320px] max-w-full max-h-[70vh]"
            headerClassName="bg-gradient-to-r from-[hsl(28_90%_50%/0.14)] to-[hsl(0_75%_50%/0.06)]"
            title={
                <>
                    <span className="inline-flex items-center rounded bg-gradient-to-r from-[hsl(28_90%_50%)] to-[hsl(0_75%_50%)] px-1.5 py-0.5 text-[9px] font-bold tracking-wider text-white">
                        WATCH
                    </span>
                    Event tracker
                </>
            }
        >
            <div className="flex min-h-0 flex-col gap-2 p-3">
                <Switcher
                    value={tab}
                    onChange={select}
                    aria-label="Watched areas or activity"
                    tabs={[
                        {
                            id: 'watching',
                            label: <>Active tasks{trackerCount > 0 && <Count n={trackerCount} />}</>,
                        },
                        { id: 'activity', label: <>Activity{unread > 0 && <Count n={unread} on />}</> },
                    ]}
                />

                {tab === 'watching' ? (
                    <div className="flex max-h-[52vh] flex-col gap-2 overflow-y-auto">
                        {areas.length === 0 && ungrouped.length === 0 ? (
                            <Empty>No trackers yet — ask the agent to watch an area or condition.</Empty>
                        ) : (
                            <>
                                {areas.map((area) => (
                                    <AreaCard
                                        key={area.entryId}
                                        area={area}
                                        onFocus={() => onFocusArea(area.entryId)}
                                        onToggle={onToggle}
                                        onClear={onClear}
                                    />
                                ))}
                                {ungrouped.length > 0 && (
                                    <div className="rounded-(--sdk-radius-5) border border-(--sdk-border-low) bg-(--sdk-surface-1) p-2">
                                        <div className="mb-1 text-[10px] font-semibold uppercase tracking-wide text-(--sdk-text-low)">
                                            Other trackers
                                        </div>
                                        <ul className="flex flex-col divide-y divide-(--sdk-border-low)">
                                            {ungrouped.map((t) => (
                                                <TrackerRow
                                                    key={t.id}
                                                    tracker={t}
                                                    onToggle={onToggle}
                                                    onClear={onClear}
                                                />
                                            ))}
                                        </ul>
                                    </div>
                                )}
                            </>
                        )}
                    </div>
                ) : (
                    <div className="relative min-h-0">
                        {events.length === 0 ? (
                            <Empty>No alerts yet. Trackers log here when a condition opens or clears.</Empty>
                        ) : (
                            <>
                                <ul className="flex max-h-[52vh] flex-col divide-y divide-(--sdk-border-low) overflow-y-auto">
                                    {events.map((e) => (
                                        <li key={e.id}>
                                            <FeedRow
                                                icon={e.kind === 'opened' ? <AlertGlyph /> : <ResolvedGlyph />}
                                                iconColor={KIND_ACCENT[e.kind]}
                                                title={e.trackerName}
                                                description={e.summary}
                                                tag={{ label: e.kind, accent: KIND_ACCENT[e.kind] }}
                                                at={e.at}
                                                unread={e.at > lastSeenAt}
                                            />
                                        </li>
                                    ))}
                                </ul>
                                <div className="pointer-events-none absolute inset-x-0 bottom-0 h-5 bg-gradient-to-t from-(--sdk-surface-0) to-transparent" />
                            </>
                        )}
                    </div>
                )}
            </div>
        </RailCard>
    );
}

/** Area card: header (live dot + name + focus) + mini-KPIs + nested tracker rows. */
function AreaCard({
    area,
    onFocus,
    onToggle,
    onClear,
}: {
    area: WatchedArea;
    onFocus: () => void;
    onToggle: (id: string, enabled: boolean) => void;
    onClear: (id: string) => void;
}) {
    const firing = area.trackers.some((t) => t.enabled && t.wasActive);
    return (
        <section className="rounded-(--sdk-radius-5) border border-(--sdk-border-low) bg-(--sdk-surface-1)">
            <button
                type="button"
                onClick={onFocus}
                className="flex w-full items-center gap-2 border-0 bg-transparent px-2.5 py-2 text-left transition-colors hover:bg-(--sdk-surface-2)"
                aria-label={`Focus ${area.label} on the map`}
            >
                <span
                    className={`h-2 w-2 shrink-0 rounded-full ${firing ? 'bg-(--sdk-color-error)' : 'bg-(--sdk-color-success)'}`}
                />
                <span className="min-w-0 flex-auto truncate text-[13px] font-semibold text-(--sdk-text-high)">
                    {area.label}
                </span>
                <span className="shrink-0 text-(--sdk-text-low)">
                    <LocateGlyph />
                </span>
            </button>
            <div className="flex gap-3 border-b border-(--sdk-border-low) px-2.5 pb-2 text-[11px] [font-variant-numeric:tabular-nums]">
                <Kpi label="Incidents" value={String(area.incidents)} />
                <Kpi label="Delay ∑" value={formatDelayTerse(area.delaySeconds)} on={area.delaySeconds > 0} />
                <Kpi label="Major+" value={String(area.majorPlus)} on={area.majorPlus > 0} />
            </div>
            <ul className="flex flex-col divide-y divide-(--sdk-border-low)">
                {area.trackers.map((t) => (
                    <TrackerRow key={t.id} tracker={t} onToggle={onToggle} onClear={onClear} />
                ))}
            </ul>
        </section>
    );
}

/** One tracker rule: title + 2-line rule + live status, with an enable switch + clear. */
function TrackerRow({
    tracker,
    onToggle,
    onClear,
}: {
    tracker: Tracker;
    onToggle: (id: string, enabled: boolean) => void;
    onClear: (id: string) => void;
}) {
    const status = !tracker.enabled ? 'paused' : tracker.wasActive ? 'firing' : 'watching';
    const color =
        status === 'firing'
            ? 'var(--sdk-color-error)'
            : status === 'paused'
              ? 'var(--sdk-text-low)'
              : 'var(--sdk-color-success)';
    return (
        <li className="flex flex-col gap-1 px-2.5 py-2">
            <div className="flex items-start gap-2">
                <div className="min-w-0 flex-auto">
                    <div className="truncate text-[12px] font-semibold text-(--sdk-text-high)">{tracker.name}</div>
                    <div className="mt-0.5 line-clamp-2 text-[11px] leading-snug text-(--sdk-text-medium)">
                        {tracker.rule}
                    </div>
                </div>
                <Toggle
                    checked={tracker.enabled}
                    onChange={(next) => onToggle(tracker.id, next)}
                    size="sm"
                    title={tracker.enabled ? 'Pause tracker' : 'Resume tracker'}
                    labelClassName={null}
                />
            </div>
            <div className="flex items-center gap-2 text-[11px]">
                <span className="font-semibold capitalize" style={{ color }}>
                    {status}
                </span>
                {status === 'firing' && tracker.openedAt != null && (
                    <span className="text-(--sdk-text-low)">since {relativeAge(tracker.openedAt)}</span>
                )}
                <button
                    type="button"
                    onClick={() => onClear(tracker.id)}
                    aria-label={`Clear ${tracker.name}`}
                    title="Clear tracker"
                    className="ml-auto inline-flex h-6 w-6 cursor-pointer items-center justify-center rounded-(--sdk-radius-5) border-0 bg-transparent text-(--sdk-text-low) transition-colors hover:bg-(--sdk-surface-2) hover:text-(--sdk-text-high)"
                >
                    <TrashGlyph />
                </button>
            </div>
        </li>
    );
}

function Kpi({ label, value, on }: { label: string; value: string; on?: boolean }) {
    return (
        <div className="flex flex-col">
            <span className={`text-[13px] font-semibold ${on ? 'text-(--sdk-text-high)' : 'text-(--sdk-text-medium)'}`}>
                {value}
            </span>
            <span className="text-[10px] uppercase tracking-wide text-(--sdk-text-low)">{label}</span>
        </div>
    );
}

function Count({ n, on }: { n: number; on?: boolean }) {
    return (
        <span
            className={`ml-1 inline-flex h-4 min-w-4 items-center justify-center rounded-full px-1 text-[10px] font-bold ${
                on ? 'bg-(--sdk-color-error) text-white' : 'bg-(--sdk-border-high) text-(--sdk-text-high)'
            }`}
        >
            {n}
        </span>
    );
}

function Empty({ children }: { children: React.ReactNode }) {
    return <p className="px-1 py-3 text-[12px] leading-snug text-(--sdk-text-low)">{children}</p>;
}
