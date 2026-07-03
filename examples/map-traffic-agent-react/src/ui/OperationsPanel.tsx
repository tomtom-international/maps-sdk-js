import { formatDuration } from '@tomtom-org/maps-sdk/core';
import type { Tracker, TrackerEvent } from '@tomtom-org/maps-sdk-plugin-agent-toolkit';
import { useEffect, useState } from 'react';
import type { MonitoredRoute } from '../hooks/useRouteMonitor';
import type { WatchedArea } from '../hooks/useTrackers';
import { FeedRow, IconButton, PanelCard, Switcher, Toggle } from './components';
import { playbook } from './lib/playbook-tokens';
import { relativeAge } from './lib/time';
import { AlertGlyph, LocateGlyph, ResolvedGlyph, RouteGlyph, StopGlyph, TrashGlyph } from './trackerIcons';

/**
 * Re-render the panel once a second (while `active`) so relative-age lines ("Paused 5m ago", feed
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
    routes: readonly MonitoredRoute[];
    trackerCount: number;
    events: readonly TrackerEvent[];
    lastSeenAt: number;
    onToggle: (trackerId: string, enabled: boolean) => void;
    onClear: (trackerId: string) => void;
    onFocusArea: (entryId: string) => void;
    onFocusRoute: (entryId: string) => void;
    onStopRoute: (entryId: string) => void;
    onSeen: () => void;
};

type Tab = 'watching' | 'activity';

const KIND_ACCENT: Record<TrackerEvent['kind'], string> = {
    opened: playbook.status.error,
    resolved: playbook.text.lowEm,
};

/**
 * The "Monitoring" panel: a plain titled card with a Watching / Activity switcher. Watching is
 * everything live right now — one card per watched incident area (named, click to frame it) with its
 * trackers nested inside, one card per monitored route corridor (live alternatives), and an "Other"
 * card for trackers spanning several areas or none. Activity is the alert feed.
 */
export function OperationsPanel({
    areas,
    ungrouped,
    routes,
    trackerCount,
    events,
    lastSeenAt,
    onToggle,
    onClear,
    onFocusArea,
    onFocusRoute,
    onStopRoute,
    onSeen,
}: OperationsPanelProps) {
    const [tab, setTab] = useState<Tab>('watching');
    const unread = events.reduce((n, e) => (e.at > lastSeenAt ? n + 1 : n), 0);
    const active = trackerCount > 0 || areas.length > 0 || routes.length > 0 || events.length > 0;
    useNowTick(active);

    const hasWatching = areas.length > 0 || ungrouped.length > 0 || routes.length > 0;
    // Trackers + routes are the explicit monitors an operator sets up; the count badges them together.
    const watchingCount = trackerCount + routes.length;

    const select = (next: Tab) => {
        setTab(next);
        if (next === 'activity') onSeen();
    };

    return (
        <PanelCard
            aria-label="Monitoring — watched areas, routes and alerts"
            title="Monitoring"
            className="w-[280px] max-w-full max-h-[70vh]"
        >
            <div className="flex min-h-0 flex-col gap-2 px-3 pt-2 pb-3">
                <Switcher
                    value={tab}
                    onChange={select}
                    aria-label="Watching or activity"
                    tabs={[
                        { id: 'watching', label: <>Watching{watchingCount > 0 ? ` (${watchingCount})` : ''}</> },
                        { id: 'activity', label: <>Activity{unread > 0 ? ` (${unread})` : ''}</> },
                    ]}
                />

                {tab === 'watching' ? (
                    <div className="flex max-h-[52vh] flex-col gap-2 overflow-y-auto">
                        {!hasWatching ? (
                            <Empty>
                                Nothing watched yet — ask the agent to look at an area, monitor a route, or set up a
                                tracker.
                            </Empty>
                        ) : (
                            <>
                                {areas.map((area) => (
                                    <AreaCard
                                        key={area.entryId}
                                        area={area}
                                        onToggle={onToggle}
                                        onClear={onClear}
                                        onFocusArea={onFocusArea}
                                    />
                                ))}
                                {routes.map((route) => (
                                    <RouteCard
                                        key={route.entryId}
                                        route={route}
                                        onFocus={onFocusRoute}
                                        onStop={onStopRoute}
                                    />
                                ))}
                                {ungrouped.length > 0 && (
                                    <OtherCard trackers={ungrouped} onToggle={onToggle} onClear={onClear} />
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
                                <ul className="flex max-h-[52vh] flex-col divide-y divide-(--pb-border-low) overflow-y-auto">
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
                                <div className="pointer-events-none absolute inset-x-0 bottom-0 h-5 bg-gradient-to-t from-(--pb-surface-0) to-transparent" />
                            </>
                        )}
                    </div>
                )}
            </div>
        </PanelCard>
    );
}

/**
 * A watched-area card: the area name (click to frame it on the map), with the trackers watching
 * it nested below as divider-separated rows. Areas with no trackers show just the header — loading an
 * area is already "watching" it.
 */
function AreaCard({
    area,
    onToggle,
    onClear,
    onFocusArea,
}: {
    area: WatchedArea;
    onToggle: (id: string, enabled: boolean) => void;
    onClear: (id: string) => void;
    onFocusArea: (entryId: string) => void;
}) {
    return (
        <div className="flex flex-col rounded-(--pb-radius-10) border border-(--pb-border-low) bg-(--pb-surface-0)">
            <div className="p-3">
                <button
                    type="button"
                    onClick={() => onFocusArea(area.entryId)}
                    title={`Frame ${area.label} on the map`}
                    className="flex w-full cursor-pointer items-center gap-2 bg-transparent p-0 text-left"
                >
                    <span className="min-w-0 flex-1 truncate text-[15px] font-bold leading-snug text-(--pb-text-high)">
                        {area.label}
                    </span>
                    <span className="shrink-0 text-(--pb-text-low)">
                        <LocateGlyph />
                    </span>
                </button>
            </div>
            {area.trackers.length > 0 && (
                <div className="flex flex-col divide-y divide-(--pb-border-low) border-t border-(--pb-border-low)">
                    {area.trackers.map((tracker) => (
                        <TrackerRow
                            key={tracker.id}
                            tracker={tracker}
                            onToggle={onToggle}
                            onClear={onClear}
                            onFocus={() => onFocusArea(area.entryId)}
                        />
                    ))}
                </div>
            )}
        </div>
    );
}

/**
 * A monitored route corridor ("Traffic monitor" card): a "Route monitor" eyebrow + glyph that
 * marks it apart from a watched area, the corridor name, then one row per alternative — name, a relative
 * descriptor, and the live travel-time · distance · delay figures (delay in red when there is one). A
 * footer carries the "Updated …" age (fresh off the panel's per-second tick) and a Stop-monitoring button.
 */
function RouteCard({
    route,
    onFocus,
    onStop,
}: {
    route: MonitoredRoute;
    onFocus: (entryId: string) => void;
    onStop: (entryId: string) => void;
}) {
    // The fastest alternative right now (lowest live travel time) anchors the read; the others read as
    // "+Nm slower" against it.
    const fastest = route.alternatives.length
        ? route.alternatives.reduce((best, alt) => (alt.travelTimeInSeconds < best.travelTimeInSeconds ? alt : best))
        : null;

    return (
        <div className="flex flex-col rounded-(--pb-radius-10) border border-(--pb-border-low) bg-(--pb-surface-0)">
            <div className="flex flex-col gap-1 px-4 pt-3 pb-2">
                <div className="flex items-center gap-1.5 text-(--pb-text-medium)">
                    <RouteGlyph />
                    <span className="text-[11px] font-semibold tracking-wide uppercase">Route monitor</span>
                </div>
                <div className="flex items-center gap-2">
                    <span className="min-w-0 flex-1 truncate text-[16px] leading-6 font-bold text-(--pb-text-high)">
                        {route.label}
                    </span>
                    <IconButton
                        label={`Show ${route.label} on the map`}
                        onClick={() => onFocus(route.entryId)}
                        size="sm"
                    >
                        <LocateGlyph />
                    </IconButton>
                </div>
            </div>

            <div className="flex flex-col divide-y divide-(--pb-border-low) border-t border-(--pb-border-low)">
                {route.alternatives.map((alt) => {
                    const isFastest = alt.index === fastest?.index;
                    const slower = alt.travelTimeInSeconds - (fastest?.travelTimeInSeconds ?? 0);
                    const descriptor = isFastest
                        ? 'Fastest now'
                        : slower >= 60
                          ? `+${formatDuration(slower)} slower`
                          : 'Similar time';
                    const hasDelay = alt.trafficDelayInSeconds >= 60;
                    const delayLabel = hasDelay ? `${formatDuration(alt.trafficDelayInSeconds)} delay` : '0 min delay';
                    return (
                        <div key={alt.index} className="flex flex-col gap-1 px-4 py-3">
                            <div className="text-[14px] leading-5 font-bold text-(--pb-text-high)">
                                {alt.index === 0 ? 'Route 1' : `Alt ${alt.index}`}
                            </div>
                            <div className="text-[13px] leading-5 text-(--pb-text-medium)">{descriptor}</div>
                            <div className="flex flex-wrap items-center gap-x-1 text-[13px] leading-5">
                                <span className="font-semibold text-(--pb-text-high)">
                                    {formatDuration(alt.travelTimeInSeconds) ?? '—'}
                                </span>
                                <span className="text-(--pb-text-low)">·</span>
                                <span className="font-semibold text-(--pb-text-high)">
                                    {Math.round(alt.lengthInMeters / 1000)} km
                                </span>
                                <span className="text-(--pb-text-low)">·</span>
                                <span
                                    className="font-semibold"
                                    style={{ color: hasDelay ? playbook.status.error : playbook.text.lowEm }}
                                >
                                    {delayLabel}
                                </span>
                            </div>
                        </div>
                    );
                })}
            </div>

            <div className="flex flex-col gap-2 border-t border-(--pb-border-low) px-4 pt-2 pb-3">
                <span className="text-[10px] leading-[14px] text-(--pb-text-low)">
                    Updated {relativeAge(route.lastTickAt)}
                </span>
                <button
                    type="button"
                    onClick={() => onStop(route.entryId)}
                    aria-label={`Stop monitoring ${route.label}`}
                    className="flex w-full cursor-pointer items-center justify-center gap-2 rounded-full border border-(--pb-border-low) bg-(--pb-surface-0) px-3 py-2 text-[13px] font-semibold transition-colors hover:bg-(--pb-surface-1)"
                    style={{ color: playbook.status.error }}
                >
                    <StopGlyph />
                    Stop monitoring
                </button>
            </div>
        </div>
    );
}

/** The "Other" bucket: trackers that span several areas, or watch none — they have no single area to
 *  nest under. Same card chrome as an area, minus the KPI chips. */
function OtherCard({
    trackers,
    onToggle,
    onClear,
}: {
    trackers: readonly Tracker[];
    onToggle: (id: string, enabled: boolean) => void;
    onClear: (id: string) => void;
}) {
    return (
        <div className="flex flex-col rounded-(--pb-radius-10) border border-(--pb-border-low) bg-(--pb-surface-0)">
            <div className="p-3 text-[15px] font-bold leading-snug text-(--pb-text-high)">Other</div>
            <div className="flex flex-col divide-y divide-(--pb-border-low) border-t border-(--pb-border-low)">
                {trackers.map((tracker) => (
                    <TrackerRow key={tracker.id} tracker={tracker} onToggle={onToggle} onClear={onClear} />
                ))}
            </div>
        </div>
    );
}

/** A single tracker as a borderless row inside an area / "Other" card: name, rule (2 lines), a status
 *  line, and an action row (optional focus + clear, with an enable toggle). */
function TrackerRow({
    tracker,
    onToggle,
    onClear,
    onFocus,
}: {
    tracker: Tracker;
    onToggle: (id: string, enabled: boolean) => void;
    onClear: (id: string) => void;
    onFocus?: () => void;
}) {
    const firing = tracker.enabled && tracker.wasActive;
    const statusText = !tracker.enabled
        ? tracker.openedAt != null
            ? `Paused · ${relativeAge(tracker.openedAt)}`
            : 'Paused'
        : firing
          ? tracker.openedAt != null
              ? `Firing · since ${relativeAge(tracker.openedAt)}`
              : 'Firing'
          : 'Watching';
    const statusColor = firing ? playbook.status.error : playbook.text.lowEm;

    return (
        <div className="flex flex-col gap-2 p-3">
            <div className="text-[14px] font-bold leading-snug text-(--pb-text-high)">{tracker.name}</div>
            <div className="line-clamp-2 text-[13px] leading-snug text-(--pb-text-medium)">{tracker.rule}</div>
            <div className="text-[12px]" style={{ color: statusColor }}>
                {statusText}
            </div>
            <div className="flex items-center gap-1">
                {onFocus && (
                    <IconButton label={`Focus ${tracker.name} on the map`} onClick={onFocus} size="sm">
                        <LocateGlyph />
                    </IconButton>
                )}
                <IconButton label={`Clear ${tracker.name}`} onClick={() => onClear(tracker.id)} size="sm">
                    <TrashGlyph />
                </IconButton>
                <div className="ml-auto">
                    <Toggle
                        checked={tracker.enabled}
                        onChange={(next) => onToggle(tracker.id, next)}
                        size="md"
                        tone="success"
                        title={tracker.enabled ? 'Pause tracker' : 'Resume tracker'}
                        labelClassName={null}
                    />
                </div>
            </div>
        </div>
    );
}

function Empty({ children }: { children: React.ReactNode }) {
    return <p className="px-1 py-3 text-[12px] leading-snug text-(--pb-text-low)">{children}</p>;
}
