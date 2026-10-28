import type {
    BYODDataset,
    CustomGeometriesDataset,
    PlacesDataset,
    RangesDataset,
    RoutesDataset,
    TrafficAreaAnalyticsDataset,
    TrafficIncidentsDataset,
} from '@tomtom-org/maps-sdk-plugin-agent-toolkit';
import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { DatasetDetailsContent } from './DatasetDetailsContent';
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
import { showByodDataset, showCustomGeometriesDataset, showRangeDataset, showRouteDataset } from './showHelpers';
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

type RailKind = 'places' | 'routes' | 'ranges' | 'geometries' | 'byod' | 'incidents' | 'areaAnalytics';

const TABS: { id: DrawerTab; label: string; Icon: typeof PinIcon }[] = [
    { id: 'places', label: 'Places', Icon: PinIcon },
    { id: 'routes', label: 'Routes', Icon: RouteIcon },
    { id: 'ranges', label: 'Ranges', Icon: RangeIcon },
    { id: 'geometries', label: 'Geometries', Icon: GeometriesIcon },
    { id: 'byod', label: 'Data', Icon: ByodIcon },
    { id: 'incidents', label: 'Incidents', Icon: IncidentsIcon },
    { id: 'areaAnalytics', label: 'Analytics', Icon: AnalyticsIcon },
    // Combined, cross-dataset view of every analysis (sits at the session level, not under one kind).
    { id: 'analyses', label: 'Analyses', Icon: ChartIcon },
    // Single "Map" tab grouping every vector-tile control: style switcher,
    // built-in POIs, base-map layers, and traffic.
    { id: 'map', label: 'Map', Icon: LayersIcon },
];

// Icon per dataset kind, used by the recent-shortcuts rail. Mirrors the TABS icons
// but keyed by RailKind ('geometries'/'byod' rather than the 'map' tab id).
const KIND_ICONS: Record<RailKind, typeof PinIcon> = {
    places: PinIcon,
    routes: RouteIcon,
    ranges: RangeIcon,
    geometries: GeometriesIcon,
    byod: ByodIcon,
    incidents: IncidentsIcon,
    areaAnalytics: AnalyticsIcon,
};

type AnyDataset =
    | { kind: 'places'; dataset: PlacesDataset }
    | { kind: 'routes'; dataset: RoutesDataset }
    | { kind: 'ranges'; dataset: RangesDataset }
    | { kind: 'geometries'; dataset: CustomGeometriesDataset }
    | { kind: 'byod'; dataset: BYODDataset }
    | { kind: 'incidents'; dataset: TrafficIncidentsDataset }
    | { kind: 'areaAnalytics'; dataset: TrafficAreaAnalyticsDataset };

type RightRailProps = { agent: Agent };

const RECENT_SHORTCUT_LIMIT = 6;

const visibilityKey = (kind: RailKind, id: string) => `${kind}:${id}`;

// Choose the marker type that's nicest for a dataset's place count.
const placesMarkerTypeFor = (dataset: PlacesDataset): 'pin' | 'base-map' => (dataset.data.length >= 10 ? 'base-map' : 'pin');

export function RightRail({ agent }: RightRailProps) {
    // Drawer is closed on first load. The first time the user opens it, default to the 'map' tab;
    // afterwards, remember the last tab they actively chose so reopening restores their selection.
    const [drawerTab, setDrawerTab] = useState<DrawerTab | null>(null);
    const lastTabRef = useRef<DrawerTab>('map');
    const [activeDataset, setActiveDataset] = useState<AnyDataset | null>(null);

    useEffect(() => {
        if (drawerTab !== null) lastTabRef.current = drawerTab;
    }, [drawerTab]);
    // UI-level visibility tracking — the agent-toolkit doesn't have this concept, but the rail
    // does, so it can lay each dataset's intent over the per-slice "shown set" the agent manages.
    const [visibility, setVisibility] = useState<Map<string, VisibilityMode>>(() => new Map());

    const placesDatasets = useAgentSnapshot(
        useMemo(() => [{ events: agent.state.places.events, types: ['datasets-change'] }], [agent]),
        () => agent.state.places.datasets,
    );
    const routesDatasets = useAgentSnapshot(
        useMemo(() => [{ events: agent.state.routing.events, types: ['datasets-change'] }], [agent]),
        () => agent.state.routing.datasets,
    );
    const rangesDatasets = useAgentSnapshot(
        useMemo(() => [{ events: agent.state.ranges.events, types: ['datasets-change'] }], [agent]),
        () => agent.state.ranges.datasets,
    );
    const customGeometriesDatasets = useAgentSnapshot(
        useMemo(() => [{ events: agent.state.customGeometries.events, types: ['datasets-change'] }], [agent]),
        () => agent.state.customGeometries.datasets,
    );
    const byodDatasets = useAgentSnapshot(
        useMemo(() => [{ events: agent.state.byod.events, types: ['datasets-change'] }], [agent]),
        () => agent.state.byod.datasets,
    );
    const incidentsDatasets = useAgentSnapshot(
        useMemo(() => [{ events: agent.state.trafficIncidents.events, types: ['datasets-change'] }], [agent]),
        () => agent.state.trafficIncidents.datasets,
    );
    const areaAnalyticsDatasets = useAgentSnapshot(
        useMemo(() => [{ events: agent.state.trafficAreaAnalytics.events, types: ['datasets-change'] }], [agent]),
        () => agent.state.trafficAreaAnalytics.datasets,
    );

    // Newest-first across every slice that produces datasets — places, routes,
    // ranges, custom geometries, incidents, area analytics — so the user can
    // jump back to a calculated reachable area or a derived polygon as easily
    // as a search result.
    const recentShortcuts = useMemo(() => {
        const merged: AnyDataset[] = [
            ...placesDatasets.map((dataset): AnyDataset => ({ kind: 'places', dataset })),
            ...routesDatasets.map((dataset): AnyDataset => ({ kind: 'routes', dataset })),
            ...rangesDatasets.map((dataset): AnyDataset => ({ kind: 'ranges', dataset })),
            ...customGeometriesDatasets.map((dataset): AnyDataset => ({ kind: 'geometries', dataset })),
            ...byodDatasets.map((dataset): AnyDataset => ({ kind: 'byod', dataset })),
            ...incidentsDatasets.map((dataset): AnyDataset => ({ kind: 'incidents', dataset })),
            ...areaAnalyticsDatasets.map((dataset): AnyDataset => ({ kind: 'areaAnalytics', dataset })),
        ];
        return merged.sort((a, b) => b.dataset.timestamp - a.dataset.timestamp).slice(0, RECENT_SHORTCUT_LIMIT);
    }, [
        placesDatasets,
        routesDatasets,
        rangesDatasets,
        customGeometriesDatasets,
        byodDatasets,
        incidentsDatasets,
        areaAnalyticsDatasets,
    ]);

    // Auto-focus the drawer on whatever new dataset the agent creates (or updates: a timestamp bump
    // counts too). We snapshot whatever is "newest" on first render so prefetched state on mount
    // doesn't yank the drawer open; from then on, any change to the newest signature opens the
    // matching tab in focus mode.
    const hasInitializedRef = useRef(false);
    const lastSeenSignatureRef = useRef<string | null>(null);
    useEffect(() => {
        const newest = recentShortcuts[0];
        const signature = newest ? `${newest.kind}:${newest.dataset.id}:${newest.dataset.timestamp}` : null;
        if (!hasInitializedRef.current) {
            lastSeenSignatureRef.current = signature;
            hasInitializedRef.current = true;
            return;
        }
        if (!newest || signature === lastSeenSignatureRef.current) return;
        lastSeenSignatureRef.current = signature;
        setDrawerTab(newest.kind);
        setActiveDataset(newest);
    }, [recentShortcuts]);

    const getVisibility = useCallback(
        (kind: RailKind) =>
            (id: string): VisibilityMode =>
                visibility.get(visibilityKey(kind, id)) ?? 'on-selection',
        [visibility],
    );

    const showOnMap = useCallback(
        async (selection: AnyDataset) => {
            if (selection.kind === 'places') {
                await agent.state.places.setShownDatasets([selection.dataset.id], placesMarkerTypeFor(selection.dataset));
            } else if (selection.kind === 'routes') {
                await showRouteDataset(agent, selection.dataset);
            } else if (selection.kind === 'ranges') {
                await showRangeDataset(agent, selection.dataset);
            } else if (selection.kind === 'geometries') {
                await showCustomGeometriesDataset(agent, selection.dataset);
            } else if (selection.kind === 'byod') {
                await showByodDataset(agent, selection.dataset);
            } else if (selection.kind === 'incidents') {
                await agent.state.trafficIncidents.showDataset(selection.dataset.id);
            } else {
                await agent.state.trafficAreaAnalytics.showDataset(selection.dataset.id);
            }
        },
        [agent],
    );

    const hideOnMap = useCallback(
        async (kind: RailKind, id: string) => {
            try {
                if (kind === 'places') await agent.state.places.removeShownDatasets([id]);
                else if (kind === 'routes') await agent.state.routing.hideDataset(id);
                else if (kind === 'ranges') await agent.state.ranges.hideDataset(id);
                else if (kind === 'geometries') await agent.state.customGeometries.hideDataset(id);
                else if (kind === 'byod') await agent.state.byod.hideDataset(id);
                else if (kind === 'incidents') await agent.state.trafficIncidents.hideDataset(id);
                else await agent.state.trafficAreaAnalytics.hideDataset(id);
            } catch (error) {
                console.error('Failed to hide dataset', kind, id, error);
            }
        },
        [agent],
    );

    const showDetails = useCallback(
        async (selection: AnyDataset) => {
            const mode = visibility.get(visibilityKey(selection.kind, selection.dataset.id)) ?? 'on-selection';
            try {
                if (mode === 'on-selection') {
                    // Hide the previous on-selection dataset of the same kind (always-shown ones
                    // stay rendered). For routes/ranges, multi mode lets us add without disturbing
                    // pinned datasets.
                    if (
                        activeDataset &&
                        activeDataset.kind === selection.kind &&
                        activeDataset.dataset.id !== selection.dataset.id
                    ) {
                        const prevMode =
                            visibility.get(visibilityKey(activeDataset.kind, activeDataset.dataset.id)) ?? 'on-selection';
                        if (prevMode === 'on-selection') {
                            await hideOnMap(activeDataset.kind, activeDataset.dataset.id);
                        }
                    }
                    await showOnMap(selection);
                } else if (mode === 'always-shown') {
                    // Already on the map — just refresh the selection state, no map work needed.
                }
                // 'always-hidden' → just open details, do not show on the map.
                setActiveDataset(selection);
                // Snap the drawer to the matching tab so the details render inline (focus mode).
                setDrawerTab(selection.kind);
            } catch (error) {
                console.error('Failed to display dataset', selection.dataset.id, error);
            }
        },
        [activeDataset, hideOnMap, showOnMap, visibility],
    );

    const changeVisibility = useCallback(
        async (kind: RailKind, id: string, next: VisibilityMode) => {
            const key = visibilityKey(kind, id);
            const previous = visibility.get(key) ?? 'on-selection';
            if (previous === next) return;

            // Find the matching dataset so we can call the right show helper. Pre-bucket the
            // datasets by kind so the lookup stays a flat dispatch (cognitive complexity stays
            // low — a 6-way ternary chain trips Biome's threshold).
            const datasetsByKind: Record<RailKind, readonly { id: string }[]> = {
                places: placesDatasets,
                routes: routesDatasets,
                ranges: rangesDatasets,
                geometries: customGeometriesDatasets,
                byod: byodDatasets,
                incidents: incidentsDatasets,
                areaAnalytics: areaAnalyticsDatasets,
            };
            const findSelection = (): AnyDataset | undefined => {
                const dataset = datasetsByKind[kind].find((candidate) => candidate.id === id);
                return dataset ? ({ kind, dataset } as AnyDataset) : undefined;
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
                    if (activeDataset?.kind === kind && activeDataset.dataset.id === id) {
                        setActiveDataset(null);
                    }
                } else {
                    // 'on-selection': hide unless this is the currently-active dataset.
                    const isActive = activeDataset?.kind === kind && activeDataset.dataset.id === id;
                    if (!isActive) await hideOnMap(kind, id);
                }
            } catch (error) {
                console.error('Failed to apply visibility change', kind, id, next, error);
            }
        },
        [
            activeDataset,
            areaAnalyticsDatasets,
            byodDatasets,
            customGeometriesDatasets,
            hideOnMap,
            incidentsDatasets,
            placesDatasets,
            rangesDatasets,
            routesDatasets,
            showOnMap,
            visibility,
        ],
    );

    const deleteDataset = useCallback(
        async (kind: RailKind, id: string) => {
            try {
                if (kind === 'places') await agent.state.places.removeDataset(id);
                else if (kind === 'routes') await agent.state.routing.removeDataset(id);
                else if (kind === 'ranges') await agent.state.ranges.removeDataset(id);
                else if (kind === 'geometries') await agent.state.customGeometries.removeDataset(id);
                else if (kind === 'byod') await agent.state.byod.removeDataset(id);
                else if (kind === 'incidents') await agent.state.trafficIncidents.removeDataset(id);
                else await agent.state.trafficAreaAnalytics.removeDataset(id);
                const key = visibilityKey(kind, id);
                setVisibility((prev) => {
                    if (!prev.has(key)) return prev;
                    const map = new Map(prev);
                    map.delete(key);
                    return map;
                });
                if (activeDataset?.kind === kind && activeDataset.dataset.id === id) setActiveDataset(null);
            } catch (error) {
                console.error('Failed to delete dataset', kind, id, error);
            }
        },
        [activeDataset, agent],
    );

    const exitFocusMode = useCallback(() => setActiveDataset(null), []);
    const toggleDrawer = useCallback(() => {
        setActiveDataset(null);
        setDrawerTab((current) => (current === null ? lastTabRef.current : null));
    }, []);
    const selectTab = useCallback((tab: DrawerTab) => {
        setActiveDataset(null);
        setDrawerTab(tab);
    }, []);
    const isFocusMode = activeDataset !== null && drawerTab === activeDataset.kind;

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
                <div className="flex flex-1 flex-col gap-1 overflow-y-auto" aria-label="Recent datasets">
                    {recentShortcuts.length === 0 && (
                        <div className="px-1 py-2 text-center text-[10px] leading-tight text-(--ui-text-low-em)">
                            no recents
                        </div>
                    )}
                    {recentShortcuts.map((selection) => (
                        <button
                            key={`${selection.kind}-${selection.dataset.id}`}
                            type="button"
                            onClick={() => showDetails(selection)}
                            title={selection.dataset.label}
                            className="flex flex-col items-center gap-1 rounded-(--ui-rounded-5) px-1 py-2 text-(--ui-text-med-em) transition-colors hover:bg-(--ui-surface-1) hover:text-(--ui-text-high-em)"
                        >
                            <span aria-hidden className="text-[18px] text-(--ui-surface-brand-red)">
                                {(() => {
                                    const Icon = KIND_ICONS[selection.kind];
                                    return <Icon />;
                                })()}
                            </span>
                            <span className="line-clamp-2 max-w-[44px] text-center text-[9px] leading-tight">
                                {selection.dataset.label}
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

                    {isFocusMode && activeDataset && (
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
                                {activeDataset.dataset.label}
                            </strong>
                        </div>
                    )}

                    <div className="flex-1 overflow-y-auto">
                        {isFocusMode && activeDataset ? (
                            <DatasetDetailsContent
                                key={activeDataset.dataset.id}
                                dataset={activeDataset.dataset}
                                kind={activeDataset.kind}
                                agent={agent}
                            />
                        ) : (
                            <div className="p-4">
                                {drawerTab === 'places' && (
                                    <PlacesPanel
                                        agent={agent}
                                        datasets={placesDatasets}
                                        onShowDetails={(dataset) => showDetails({ kind: 'places', dataset })}
                                        onDelete={(dataset) => deleteDataset('places', dataset.id)}
                                        visibility={getVisibility('places')}
                                        onVisibilityChange={(id, mode) => changeVisibility('places', id, mode)}
                                    />
                                )}
                                {drawerTab === 'routes' && (
                                    <RoutesPanel
                                        agent={agent}
                                        datasets={routesDatasets}
                                        onShowDetails={(dataset) => showDetails({ kind: 'routes', dataset })}
                                        onDelete={(dataset) => deleteDataset('routes', dataset.id)}
                                        visibility={getVisibility('routes')}
                                        onVisibilityChange={(id, mode) => changeVisibility('routes', id, mode)}
                                    />
                                )}
                                {drawerTab === 'ranges' && (
                                    <RangesPanel
                                        agent={agent}
                                        datasets={rangesDatasets}
                                        onShowDetails={(dataset) => showDetails({ kind: 'ranges', dataset })}
                                        onDelete={(dataset) => deleteDataset('ranges', dataset.id)}
                                        visibility={getVisibility('ranges')}
                                        onVisibilityChange={(id, mode) => changeVisibility('ranges', id, mode)}
                                    />
                                )}
                                {drawerTab === 'geometries' && (
                                    <GeometriesPanel
                                        agent={agent}
                                        datasets={customGeometriesDatasets}
                                        onShowDetails={(dataset) => showDetails({ kind: 'geometries', dataset })}
                                        onDelete={(dataset) => deleteDataset('geometries', dataset.id)}
                                        visibility={getVisibility('geometries')}
                                        onVisibilityChange={(id, mode) => changeVisibility('geometries', id, mode)}
                                    />
                                )}
                                {drawerTab === 'byod' && (
                                    <ByodPanel
                                        agent={agent}
                                        datasets={byodDatasets}
                                        onShowDetails={(dataset) => showDetails({ kind: 'byod', dataset })}
                                        onDelete={(dataset) => deleteDataset('byod', dataset.id)}
                                        visibility={getVisibility('byod')}
                                        onVisibilityChange={(id, mode) => changeVisibility('byod', id, mode)}
                                    />
                                )}
                                {drawerTab === 'incidents' && (
                                    <IncidentsPanel
                                        agent={agent}
                                        datasets={incidentsDatasets}
                                        onShowDetails={(dataset) => showDetails({ kind: 'incidents', dataset })}
                                        onDelete={(dataset) => deleteDataset('incidents', dataset.id)}
                                        visibility={getVisibility('incidents')}
                                        onVisibilityChange={(id, mode) => changeVisibility('incidents', id, mode)}
                                    />
                                )}
                                {drawerTab === 'areaAnalytics' && (
                                    <AreaAnalyticsPanel
                                        agent={agent}
                                        datasets={areaAnalyticsDatasets}
                                        onShowDetails={(dataset) => showDetails({ kind: 'areaAnalytics', dataset })}
                                        onDelete={(dataset) => deleteDataset('areaAnalytics', dataset.id)}
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
