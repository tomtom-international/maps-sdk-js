import type {
    BYODEntry,
    CustomGeometriesEntry,
    PlacesEntry,
    RangesEntry,
    RoutesEntry,
    TrafficAreaAnalyticsEntry,
    TrafficIncidentsEntry,
} from '@tomtom-org/maps-sdk-plugin-agent-toolkit';
import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { EntryDetailsContent } from './EntryDetailsContent';
import {
    AnalyticsIcon,
    ByodIcon,
    ChartIcon,
    ChevronRightIcon,
    GeometriesIcon,
    IncidentsIcon,
    LayersIcon,
    MenuIcon,
    PinIcon,
    RangeIcon,
    RouteIcon,
} from './Icons';
import {
    AnalysesPanel,
    AreaAnalyticsPanel,
    ByodPanel,
    GeometriesPanel,
    IncidentsPanel,
    MapPanel,
    PlacesPanel,
    RangesPanel,
    RoutesPanel,
} from './panels';
import { showByodEntry, showCustomGeometriesEntry, showRangeEntry, showRouteEntry } from './showHelpers';
import { type Agent, useAgentSnapshot } from './useAgentSnapshot';
import type { VisibilityMode } from './VisibilityToggle';

type DrawerTab =
    | 'places'
    | 'routes'
    | 'ranges'
    | 'geometries'
    | 'byod'
    | 'incidents'
    | 'areaAnalytics'
    | 'analyses'
    | 'map';

type EntryKind = 'places' | 'routes' | 'ranges' | 'geometries' | 'byod' | 'incidents' | 'areaAnalytics';

const TABS: { id: DrawerTab; label: string; Icon: typeof PinIcon }[] = [
    { id: 'places', label: 'Places', Icon: PinIcon },
    { id: 'routes', label: 'Routes', Icon: RouteIcon },
    { id: 'ranges', label: 'Ranges', Icon: RangeIcon },
    { id: 'geometries', label: 'Geometries', Icon: GeometriesIcon },
    { id: 'byod', label: 'Data', Icon: ByodIcon },
    { id: 'incidents', label: 'Incidents', Icon: IncidentsIcon },
    { id: 'areaAnalytics', label: 'Analytics', Icon: AnalyticsIcon },
    // Combined, cross-entry view of every analysis (sits at the session level, not under one kind).
    { id: 'analyses', label: 'Analyses', Icon: ChartIcon },
    // Single "Map" tab grouping every vector-tile control: style switcher,
    // built-in POIs, base-map layers, and traffic.
    { id: 'map', label: 'Map', Icon: LayersIcon },
];

// Icon per entry kind, used by the recent-shortcuts rail. Mirrors the TABS icons
// but keyed by EntryKind ('geometries'/'byod' rather than the 'map' tab id).
const KIND_ICONS: Record<EntryKind, typeof PinIcon> = {
    places: PinIcon,
    routes: RouteIcon,
    ranges: RangeIcon,
    geometries: GeometriesIcon,
    byod: ByodIcon,
    incidents: IncidentsIcon,
    areaAnalytics: AnalyticsIcon,
};

type AnyEntry =
    | { kind: 'places'; entry: PlacesEntry }
    | { kind: 'routes'; entry: RoutesEntry }
    | { kind: 'ranges'; entry: RangesEntry }
    | { kind: 'geometries'; entry: CustomGeometriesEntry }
    | { kind: 'byod'; entry: BYODEntry }
    | { kind: 'incidents'; entry: TrafficIncidentsEntry }
    | { kind: 'areaAnalytics'; entry: TrafficAreaAnalyticsEntry };

type RightRailProps = { agent: Agent };

const RECENT_SHORTCUT_LIMIT = 6;

const visibilityKey = (kind: EntryKind, id: string) => `${kind}:${id}`;

// Choose the marker type that's nicest for an entry's place count.
const placesMarkerTypeFor = (entry: PlacesEntry): 'pin' | 'base-map' => (entry.data.length >= 10 ? 'base-map' : 'pin');

export function RightRail({ agent }: RightRailProps) {
    // Drawer is closed on first load. The first time the user opens it, default to the 'map' tab;
    // afterwards, remember the last tab they actively chose so reopening restores their selection.
    const [drawerTab, setDrawerTab] = useState<DrawerTab | null>(null);
    const lastTabRef = useRef<DrawerTab>('map');
    const [activeEntry, setActiveEntry] = useState<AnyEntry | null>(null);

    useEffect(() => {
        if (drawerTab !== null) lastTabRef.current = drawerTab;
    }, [drawerTab]);
    // UI-level visibility tracking — the agent-toolkit doesn't have this concept, but the rail
    // does, so it can lay each entry's intent over the per-slice "shown set" the agent manages.
    const [visibility, setVisibility] = useState<Map<string, VisibilityMode>>(() => new Map());

    const placesEntries = useAgentSnapshot(
        useMemo(() => [{ events: agent.state.places.events, types: ['entries-change'] }], [agent]),
        () => agent.state.places.entries,
    );
    const routesEntries = useAgentSnapshot(
        useMemo(() => [{ events: agent.state.routing.events, types: ['entries-change'] }], [agent]),
        () => agent.state.routing.entries,
    );
    const rangesEntries = useAgentSnapshot(
        useMemo(() => [{ events: agent.state.ranges.events, types: ['entries-change'] }], [agent]),
        () => agent.state.ranges.entries,
    );
    const customGeometriesEntries = useAgentSnapshot(
        useMemo(() => [{ events: agent.state.customGeometries.events, types: ['entries-change'] }], [agent]),
        () => agent.state.customGeometries.entries,
    );
    const byodEntries = useAgentSnapshot(
        useMemo(() => [{ events: agent.state.byod.events, types: ['entries-change'] }], [agent]),
        () => agent.state.byod.entries,
    );
    const incidentsEntries = useAgentSnapshot(
        useMemo(() => [{ events: agent.state.trafficIncidents.events, types: ['entries-change'] }], [agent]),
        () => agent.state.trafficIncidents.entries,
    );
    const areaAnalyticsEntries = useAgentSnapshot(
        useMemo(() => [{ events: agent.state.trafficAreaAnalytics.events, types: ['entries-change'] }], [agent]),
        () => agent.state.trafficAreaAnalytics.entries,
    );

    // Newest-first across every slice that produces entries — places, routes,
    // ranges, custom geometries, incidents, area analytics — so the user can
    // jump back to a calculated reachable area or a derived polygon as easily
    // as a search result.
    const recentShortcuts = useMemo(() => {
        const merged: AnyEntry[] = [
            ...placesEntries.map((entry): AnyEntry => ({ kind: 'places', entry })),
            ...routesEntries.map((entry): AnyEntry => ({ kind: 'routes', entry })),
            ...rangesEntries.map((entry): AnyEntry => ({ kind: 'ranges', entry })),
            ...customGeometriesEntries.map((entry): AnyEntry => ({ kind: 'geometries', entry })),
            ...byodEntries.map((entry): AnyEntry => ({ kind: 'byod', entry })),
            ...incidentsEntries.map((entry): AnyEntry => ({ kind: 'incidents', entry })),
            ...areaAnalyticsEntries.map((entry): AnyEntry => ({ kind: 'areaAnalytics', entry })),
        ];
        return merged.sort((a, b) => b.entry.timestamp - a.entry.timestamp).slice(0, RECENT_SHORTCUT_LIMIT);
    }, [
        placesEntries,
        routesEntries,
        rangesEntries,
        customGeometriesEntries,
        byodEntries,
        incidentsEntries,
        areaAnalyticsEntries,
    ]);

    // Auto-focus the drawer on whatever new entry the agent creates (or updates: a timestamp bump
    // counts too). We snapshot whatever is "newest" on first render so prefetched state on mount
    // doesn't yank the drawer open; from then on, any change to the newest signature opens the
    // matching tab in focus mode.
    const hasInitializedRef = useRef(false);
    const lastSeenSignatureRef = useRef<string | null>(null);
    useEffect(() => {
        const newest = recentShortcuts[0];
        const signature = newest ? `${newest.kind}:${newest.entry.id}:${newest.entry.timestamp}` : null;
        if (!hasInitializedRef.current) {
            lastSeenSignatureRef.current = signature;
            hasInitializedRef.current = true;
            return;
        }
        if (!newest || signature === lastSeenSignatureRef.current) return;
        lastSeenSignatureRef.current = signature;
        setDrawerTab(newest.kind);
        setActiveEntry(newest);
    }, [recentShortcuts]);

    const getVisibility = useCallback(
        (kind: EntryKind) =>
            (id: string): VisibilityMode =>
                visibility.get(visibilityKey(kind, id)) ?? 'on-selection',
        [visibility],
    );

    const showOnMap = useCallback(
        async (selection: AnyEntry) => {
            if (selection.kind === 'places') {
                await agent.state.places.setShownEntries([selection.entry.id], placesMarkerTypeFor(selection.entry));
            } else if (selection.kind === 'routes') {
                await showRouteEntry(agent, selection.entry);
            } else if (selection.kind === 'ranges') {
                await showRangeEntry(agent, selection.entry);
            } else if (selection.kind === 'geometries') {
                await showCustomGeometriesEntry(agent, selection.entry);
            } else if (selection.kind === 'byod') {
                await showByodEntry(agent, selection.entry);
            } else if (selection.kind === 'incidents') {
                await agent.state.trafficIncidents.showEntry(selection.entry.id);
            } else {
                await agent.state.trafficAreaAnalytics.showEntry(selection.entry.id);
            }
        },
        [agent],
    );

    const hideOnMap = useCallback(
        async (kind: EntryKind, id: string) => {
            try {
                if (kind === 'places') await agent.state.places.removeShownEntries([id]);
                else if (kind === 'routes') await agent.state.routing.hideEntry(id);
                else if (kind === 'ranges') await agent.state.ranges.hideEntry(id);
                else if (kind === 'geometries') await agent.state.customGeometries.hideEntry(id);
                else if (kind === 'byod') await agent.state.byod.hideEntry(id);
                else if (kind === 'incidents') await agent.state.trafficIncidents.hideEntry(id);
                else await agent.state.trafficAreaAnalytics.hideEntry(id);
            } catch (error) {
                console.error('Failed to hide entry', kind, id, error);
            }
        },
        [agent],
    );

    const showDetails = useCallback(
        async (selection: AnyEntry) => {
            const mode = visibility.get(visibilityKey(selection.kind, selection.entry.id)) ?? 'on-selection';
            try {
                if (mode === 'on-selection') {
                    // Hide the previous on-selection entry of the same kind (always-shown ones
                    // stay rendered). For routes/ranges, multi mode lets us add without disturbing
                    // pinned entries.
                    if (
                        activeEntry &&
                        activeEntry.kind === selection.kind &&
                        activeEntry.entry.id !== selection.entry.id
                    ) {
                        const prevMode =
                            visibility.get(visibilityKey(activeEntry.kind, activeEntry.entry.id)) ?? 'on-selection';
                        if (prevMode === 'on-selection') {
                            await hideOnMap(activeEntry.kind, activeEntry.entry.id);
                        }
                    }
                    await showOnMap(selection);
                } else if (mode === 'always-shown') {
                    // Already on the map — just refresh the selection state, no map work needed.
                }
                // 'always-hidden' → just open details, do not show on the map.
                setActiveEntry(selection);
                // Snap the drawer to the matching tab so the details render inline (focus mode).
                setDrawerTab(selection.kind);
            } catch (error) {
                console.error('Failed to display entry', selection.entry.id, error);
            }
        },
        [activeEntry, hideOnMap, showOnMap, visibility],
    );

    const changeVisibility = useCallback(
        async (kind: EntryKind, id: string, next: VisibilityMode) => {
            const key = visibilityKey(kind, id);
            const previous = visibility.get(key) ?? 'on-selection';
            if (previous === next) return;

            // Find the matching entry so we can call the right show helper. Pre-bucket the
            // entries by kind so the lookup stays a flat dispatch (cognitive complexity stays
            // low — a 6-way ternary chain trips Biome's threshold).
            const entriesByKind: Record<EntryKind, readonly { id: string }[]> = {
                places: placesEntries,
                routes: routesEntries,
                ranges: rangesEntries,
                geometries: customGeometriesEntries,
                byod: byodEntries,
                incidents: incidentsEntries,
                areaAnalytics: areaAnalyticsEntries,
            };
            const findSelection = (): AnyEntry | undefined => {
                const entry = entriesByKind[kind].find((candidate) => candidate.id === id);
                return entry ? ({ kind, entry } as AnyEntry) : undefined;
            };

            setVisibility((prev) => {
                const map = new Map(prev);
                if (next === 'on-selection') map.delete(key);
                else map.set(key, next);
                return map;
            });

            try {
                if (next === 'always-shown') {
                    const selection = findSelection();
                    if (selection) await showOnMap(selection);
                } else if (next === 'always-hidden') {
                    await hideOnMap(kind, id);
                    if (activeEntry?.kind === kind && activeEntry.entry.id === id) {
                        setActiveEntry(null);
                    }
                } else {
                    // 'on-selection': hide unless this is the currently-active entry.
                    const isActive = activeEntry?.kind === kind && activeEntry.entry.id === id;
                    if (!isActive) await hideOnMap(kind, id);
                }
            } catch (error) {
                console.error('Failed to apply visibility change', kind, id, next, error);
            }
        },
        [
            activeEntry,
            areaAnalyticsEntries,
            byodEntries,
            customGeometriesEntries,
            hideOnMap,
            incidentsEntries,
            placesEntries,
            rangesEntries,
            routesEntries,
            showOnMap,
            visibility,
        ],
    );

    const deleteEntry = useCallback(
        async (kind: EntryKind, id: string) => {
            try {
                if (kind === 'places') await agent.state.places.removeEntry(id);
                else if (kind === 'routes') await agent.state.routing.removeEntry(id);
                else if (kind === 'ranges') await agent.state.ranges.removeEntry(id);
                else if (kind === 'geometries') await agent.state.customGeometries.removeEntry(id);
                else if (kind === 'byod') await agent.state.byod.removeEntry(id);
                else if (kind === 'incidents') await agent.state.trafficIncidents.removeEntry(id);
                else await agent.state.trafficAreaAnalytics.removeEntry(id);
                const key = visibilityKey(kind, id);
                setVisibility((prev) => {
                    if (!prev.has(key)) return prev;
                    const map = new Map(prev);
                    map.delete(key);
                    return map;
                });
                if (activeEntry?.kind === kind && activeEntry.entry.id === id) setActiveEntry(null);
            } catch (error) {
                console.error('Failed to delete entry', kind, id, error);
            }
        },
        [activeEntry, agent],
    );

    const exitFocusMode = useCallback(() => setActiveEntry(null), []);
    const toggleDrawer = useCallback(() => {
        setActiveEntry(null);
        setDrawerTab((current) => (current === null ? lastTabRef.current : null));
    }, []);
    const selectTab = useCallback((tab: DrawerTab) => {
        setActiveEntry(null);
        setDrawerTab(tab);
    }, []);
    const isFocusMode = activeEntry !== null && drawerTab === activeEntry.kind;

    return (
        <>
            {/* Edge-flush rail: full height, no margin/border-radius/shadow on outer corners. */}
            <aside
                aria-label="Map controls"
                className="relative z-[5] flex w-14 shrink-0 flex-col items-stretch gap-2 rounded-[20px] bg-(--ui-surface-0) px-1.5 py-3 shadow-(--ui-elevation-e3)"
            >
                <button
                    type="button"
                    onClick={toggleDrawer}
                    aria-label="Toggle controls"
                    className={`flex h-11 items-center justify-center rounded-(--ui-rounded-10) text-(--ui-text-high-em) transition-colors hover:bg-(--ui-surface-1) ${drawerTab ? 'bg-(--ui-surface-2)' : ''}`}
                >
                    <MenuIcon className="text-[20px]" />
                </button>
                <div className="mx-1.5 h-px bg-(--ui-border-low-em)" />
                <div className="flex flex-1 flex-col gap-1 overflow-y-auto" aria-label="Recent entries">
                    {recentShortcuts.length === 0 && (
                        <div className="px-1 py-2 text-center text-[10px] leading-tight text-(--ui-text-low-em)">
                            no recents
                        </div>
                    )}
                    {recentShortcuts.map((selection) => (
                        <button
                            key={`${selection.kind}-${selection.entry.id}`}
                            type="button"
                            onClick={() => showDetails(selection)}
                            title={selection.entry.label}
                            className="flex flex-col items-center gap-1 rounded-(--ui-rounded-5) px-1 py-2 text-(--ui-text-med-em) transition-colors hover:bg-(--ui-surface-1) hover:text-(--ui-text-high-em)"
                        >
                            <span aria-hidden className="text-[18px] text-(--ui-surface-brand-red)">
                                {(() => {
                                    const Icon = KIND_ICONS[selection.kind];
                                    return <Icon />;
                                })()}
                            </span>
                            <span className="line-clamp-2 max-w-[44px] text-center text-[9px] leading-tight">
                                {selection.entry.label}
                            </span>
                        </button>
                    ))}
                </div>
            </aside>

            {drawerTab && (
                <div
                    role="dialog"
                    aria-label={`${drawerTab} controls`}
                    className="absolute top-2 right-[calc(56px+16px)] bottom-2 z-[4] flex w-[400px] flex-col overflow-hidden rounded-(--ui-rounded-20) border border-(--ui-border-low-em) bg-(--ui-surface-0) shadow-(--ui-elevation-e2)"
                >
                    <header className="flex items-stretch border-b border-(--ui-border-low-em) bg-(--ui-surface-1)">
                        <nav className="flex flex-1 overflow-x-auto" aria-label="State sections">
                            {TABS.map(({ id, label, Icon }) => {
                                const isActive = drawerTab === id && !isFocusMode;
                                return (
                                    <button
                                        key={id}
                                        type="button"
                                        onClick={() => selectTab(id)}
                                        className={`flex shrink-0 flex-col items-center gap-0.5 border-b-2 px-3 py-2 text-[10px] font-medium transition-colors ${
                                            isActive
                                                ? 'border-(--ui-surface-brand-red) text-(--ui-text-high-em)'
                                                : 'border-transparent text-(--ui-text-med-em) hover:text-(--ui-text-high-em)'
                                        }`}
                                    >
                                        <Icon className="text-[16px]" />
                                        <span>{label}</span>
                                    </button>
                                );
                            })}
                        </nav>
                    </header>

                    {isFocusMode && activeEntry && (
                        <div className="flex items-center gap-2 border-b border-(--ui-border-low-em) bg-(--ui-surface-0) px-3 py-2">
                            <button
                                type="button"
                                onClick={exitFocusMode}
                                className="flex cursor-pointer items-center gap-1 rounded-(--ui-rounded-5) px-2 py-1 text-[12px] font-medium text-(--ui-text-med-em) transition-colors hover:bg-(--ui-surface-1) hover:text-(--ui-text-high-em)"
                            >
                                <ChevronRightIcon className="rotate-180 text-[14px]" />
                                <span>Back</span>
                            </button>
                            <strong className="min-w-0 flex-1 truncate text-[13px] font-semibold text-(--ui-text-high-em)">
                                {activeEntry.entry.label}
                            </strong>
                        </div>
                    )}

                    <div className="flex-1 overflow-y-auto">
                        {isFocusMode && activeEntry ? (
                            <EntryDetailsContent
                                key={activeEntry.entry.id}
                                entry={activeEntry.entry}
                                kind={activeEntry.kind}
                                agent={agent}
                            />
                        ) : (
                            <div className="p-4">
                                {drawerTab === 'places' && (
                                    <PlacesPanel
                                        agent={agent}
                                        entries={placesEntries}
                                        onShowDetails={(entry) => showDetails({ kind: 'places', entry })}
                                        onDelete={(entry) => deleteEntry('places', entry.id)}
                                        visibility={getVisibility('places')}
                                        onVisibilityChange={(id, mode) => changeVisibility('places', id, mode)}
                                    />
                                )}
                                {drawerTab === 'routes' && (
                                    <RoutesPanel
                                        agent={agent}
                                        entries={routesEntries}
                                        onShowDetails={(entry) => showDetails({ kind: 'routes', entry })}
                                        onDelete={(entry) => deleteEntry('routes', entry.id)}
                                        visibility={getVisibility('routes')}
                                        onVisibilityChange={(id, mode) => changeVisibility('routes', id, mode)}
                                    />
                                )}
                                {drawerTab === 'ranges' && (
                                    <RangesPanel
                                        agent={agent}
                                        entries={rangesEntries}
                                        onShowDetails={(entry) => showDetails({ kind: 'ranges', entry })}
                                        onDelete={(entry) => deleteEntry('ranges', entry.id)}
                                        visibility={getVisibility('ranges')}
                                        onVisibilityChange={(id, mode) => changeVisibility('ranges', id, mode)}
                                    />
                                )}
                                {drawerTab === 'geometries' && (
                                    <GeometriesPanel
                                        agent={agent}
                                        entries={customGeometriesEntries}
                                        onShowDetails={(entry) => showDetails({ kind: 'geometries', entry })}
                                        onDelete={(entry) => deleteEntry('geometries', entry.id)}
                                        visibility={getVisibility('geometries')}
                                        onVisibilityChange={(id, mode) => changeVisibility('geometries', id, mode)}
                                    />
                                )}
                                {drawerTab === 'byod' && (
                                    <ByodPanel
                                        agent={agent}
                                        entries={byodEntries}
                                        onShowDetails={(entry) => showDetails({ kind: 'byod', entry })}
                                        onDelete={(entry) => deleteEntry('byod', entry.id)}
                                        visibility={getVisibility('byod')}
                                        onVisibilityChange={(id, mode) => changeVisibility('byod', id, mode)}
                                    />
                                )}
                                {drawerTab === 'incidents' && (
                                    <IncidentsPanel
                                        agent={agent}
                                        entries={incidentsEntries}
                                        onShowDetails={(entry) => showDetails({ kind: 'incidents', entry })}
                                        onDelete={(entry) => deleteEntry('incidents', entry.id)}
                                        visibility={getVisibility('incidents')}
                                        onVisibilityChange={(id, mode) => changeVisibility('incidents', id, mode)}
                                    />
                                )}
                                {drawerTab === 'areaAnalytics' && (
                                    <AreaAnalyticsPanel
                                        agent={agent}
                                        entries={areaAnalyticsEntries}
                                        onShowDetails={(entry) => showDetails({ kind: 'areaAnalytics', entry })}
                                        onDelete={(entry) => deleteEntry('areaAnalytics', entry.id)}
                                        visibility={getVisibility('areaAnalytics')}
                                        onVisibilityChange={(id, mode) => changeVisibility('areaAnalytics', id, mode)}
                                    />
                                )}
                                {drawerTab === 'analyses' && <AnalysesPanel agent={agent} />}
                                {drawerTab === 'map' && <MapPanel agent={agent} />}
                            </div>
                        )}
                    </div>
                </div>
            )}
        </>
    );
}
