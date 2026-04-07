/**
 * @module map-agent-state
 */

import type { Place, Places, PolygonFeatures, Routes, TrafficAreaAnalytics, WaypointLike } from '@tomtom-org/maps-sdk/core';
import { TomTomConfig } from '@tomtom-org/maps-sdk/core';
import type { TrafficAreaAnalyticsConfig } from '@tomtom-org/maps-sdk/map';
import {
    BaseMapModule,
    GeometriesModule,
    type GeometryTheme,
    HillshadeModule,
    PlacesModule,
    PlanningWaypoint,
    POIsModule,
    RoutingModule,
    reachableRangeGeometryConfig,
    type TomTomMap,
    TrafficAreaAnalyticsModule,
    TrafficFlowModule,
    TrafficIncidentsModule,
} from '@tomtom-org/maps-sdk/map';
import { ReachableRangeBudget } from '@tomtom-org/maps-sdk/services';
import { Position } from 'geojson';
import { Map } from 'maplibre-gl';
import { AnalyticsControlPanel } from './ui/analytics-control-panel';

TomTomConfig.instance.put({ language: 'en-GB' });

export interface PlacesEntry {
    id: string;
    timestamp: number;
    label: string;
    data: Place[];
}

export interface RoutesEntry {
    id: string;
    timestamp: number;
    label: string;
    data: Routes;
    waypoints: WaypointLike[];
    params: RouteParams;
}

/**
 * Route planning parameters stored in routing state.
 * Consumed by setRouteLocations, addStopToRoute, and removeStopFromRoute.
 */
export interface RouteParams {
    maxAlternatives?: number;
    costModel?: {
        routeType?: string;
        traffic?: 'live' | 'historical';
        avoid?: string[];
        avoidAreas?: Array<number[]>;
    };
    when?: { option: 'departAt' | 'arriveBy'; date: string };
}

/**
 * State for place search, geocoding, and geometries.
 *
 * Holds lazy-initialized PlacesModule and GeometriesModule alongside an
 * append-only history of place and search results produced during the session.
 */
export class PlacesState {
    private _placesModule?: PlacesModule;

    private _entries: PlacesEntry[] = [];

    constructor(private readonly _ttMap: TomTomMap) {}

    // Module getters (lazy initialization)

    async getPlacesModule(): Promise<PlacesModule> {
        this._placesModule ??= await PlacesModule.get(this._ttMap);
        return this._placesModule;
    }

    // Cached module access (for reading without triggering initialization)

    get placesModule(): PlacesModule | undefined {
        return this._placesModule;
    }

    // History

    get entries(): readonly PlacesEntry[] {
        return this._entries;
    }

    /**
     * This is used purely to pass data between tools in a context-dependent way,
     * so we assume the most recent entry is the relevant one to show on the map.
     */
    get latestPlace(): Place[] | undefined {
        return this._entries.at(-1)?.data;
    }

    addPlaceResult(place: Place | Places, label: string): string {
        const id = `places-${this._entries.length}`;
        this._entries.push({
            id,
            timestamp: Date.now(),
            label,
            data: 'features' in place ? place.features : [place],
        });
        return id;
    }

    reset(): void {
        this._placesModule = undefined;
        this._entries = [];
    }
}

/**
 * State for the map POI layer (points of interest overlay).
 *
 * Holds the lazy-initialized POIsModule for showing, hiding, and filtering
 * the built-in POI categories rendered on the base map.
 */
export class MapPOIsState {
    private _poisModule?: POIsModule;

    constructor(private readonly _ttMap: TomTomMap) {}

    // Module getter (lazy initialization)

    async getPOIsModule(): Promise<POIsModule> {
        this._poisModule ??= await POIsModule.get(this._ttMap);
        return this._poisModule;
    }

    // Cached module access (for reading without triggering initialization)

    get poisModule(): POIsModule | undefined {
        return this._poisModule;
    }

    reset(): void {
        this._poisModule = undefined;
    }
}

/**
 * State for route calculation, waypoint management, and route planning parameters.
 *
 * Holds the lazy-initialized RoutingModule alongside an append-only history of
 * calculated routes, sparse planning slots (being assembled before a calculation),
 * and current route parameters.
 */
export class RoutingState {
    private _routingModule?: RoutingModule;
    private _entries: RoutesEntry[] = [];
    private _planningSlots: PlanningWaypoint[] = [];
    private _params: RouteParams = {};

    constructor(private readonly _ttMap: TomTomMap) {}

    async getRoutingModule(): Promise<RoutingModule> {
        this._routingModule ??= await RoutingModule.get(this._ttMap);
        return this._routingModule;
    }

    get routingModule(): RoutingModule | undefined {
        return this._routingModule;
    }

    // History

    get entries(): readonly RoutesEntry[] {
        return this._entries;
    }

    get currentRoutes(): Routes | undefined {
        return this._entries.at(-1)?.data;
    }

    get currentWaypoints(): WaypointLike[] | undefined {
        return this._entries.at(-1)?.waypoints;
    }

    /** Sparse nullable slots being assembled before triggering a route calculation. */
    get planningSlots(): PlanningWaypoint[] {
        return this._planningSlots;
    }

    get params(): RouteParams {
        return this._params;
    }

    addRoutes(routes: Routes, waypoints: WaypointLike[], label: string): void {
        this._entries.push({
            id: `routes-${this._entries.length}`,
            timestamp: Date.now(),
            label,
            data: routes,
            waypoints,
            params: { ...this._params },
        });
        this._planningSlots = [...waypoints];
    }

    setWaypointAt(index: number, waypoint: WaypointLike): void {
        const minSize = Math.max(2, index + 1);
        while (this._planningSlots.length < minSize) {
            this._planningSlots.push(null);
        }
        this._planningSlots[index] = waypoint;
    }

    setParams(params: Partial<RouteParams>): void {
        this._params = { ...this._params, ...params };
    }

    reset(): void {
        this._routingModule = undefined;
        this._entries = [];
        this._planningSlots = [];
        this._params = {};
    }
}

/**
 * State for base map display: style, language, viewport, layers, and hillshade.
 *
 * Provides direct access to the TomTomMap and MapLibre instances alongside
 * lazy-initialized BaseMapModule and HillshadeModule.
 */
export class BaseMapState {
    private _baseMapModule?: BaseMapModule;
    private _hillshadeModule?: HillshadeModule;

    constructor(public readonly ttMap: TomTomMap) {}

    get mapLibreMap(): Map {
        return this.ttMap.mapLibreMap;
    }

    // Module getters (lazy initialization)

    async getBaseMapModule(): Promise<BaseMapModule> {
        this._baseMapModule ??= await BaseMapModule.get(this.ttMap);
        return this._baseMapModule;
    }

    async getHillshadeModule(): Promise<HillshadeModule> {
        this._hillshadeModule ??= await HillshadeModule.get(this.ttMap);
        return this._hillshadeModule;
    }

    reset(): void {
        this._baseMapModule = undefined;
        this._hillshadeModule = undefined;
    }
}

/**
 * State for traffic: flow layer, incident overlay, and area analytics modules.
 */
export class TrafficState {
    private _trafficFlowModule?: TrafficFlowModule;
    private _trafficIncidentsModule?: TrafficIncidentsModule;
    private _trafficAreaAnalyticsModule?: TrafficAreaAnalyticsModule;
    private _lastAreaAnalytics?: TrafficAreaAnalytics;
    private _currentAnalyticsConfig?: TrafficAreaAnalyticsConfig;
    private _configChangeUnsub?: () => void;

    constructor(private readonly _ttMap: TomTomMap) {}

    // Module getters (lazy initialization)

    async getTrafficFlowModule(): Promise<TrafficFlowModule> {
        this._trafficFlowModule ??= await TrafficFlowModule.get(this._ttMap);
        return this._trafficFlowModule;
    }

    async getTrafficIncidentsModule(): Promise<TrafficIncidentsModule> {
        this._trafficIncidentsModule ??= await TrafficIncidentsModule.get(this._ttMap);
        return this._trafficIncidentsModule;
    }

    async getTrafficAreaAnalyticsModule(): Promise<TrafficAreaAnalyticsModule> {
        if (!this._trafficAreaAnalyticsModule) {
            this._trafficAreaAnalyticsModule = await TrafficAreaAnalyticsModule.get(this._ttMap);
            // Wire config change events so agent state stays in sync with module
            this._configChangeUnsub = this._trafficAreaAnalyticsModule.on('configChange', (config) => {
                this._currentAnalyticsConfig = config;
            });
        }
        return this._trafficAreaAnalyticsModule;
    }

    // Area analytics result caching

    get lastAreaAnalytics(): TrafficAreaAnalytics | undefined {
        return this._lastAreaAnalytics;
    }

    setLastAreaAnalytics(result: TrafficAreaAnalytics): void {
        this._lastAreaAnalytics = result;
    }

    /** Current visualization config, updated by module configChange events. */
    get currentAnalyticsConfig(): TrafficAreaAnalyticsConfig | undefined {
        return this._currentAnalyticsConfig;
    }

    // Control panel

    private _controlPanel?: AnalyticsControlPanel;

    get controlPanel(): AnalyticsControlPanel | undefined {
        return this._controlPanel;
    }

    /** Get or create the analytics control panel for the given map container. */
    initControlPanel(mapContainer: HTMLElement, module: TrafficAreaAnalyticsModule): AnalyticsControlPanel {
        this._controlPanel ??= new AnalyticsControlPanel(mapContainer, module);
        return this._controlPanel;
    }

    reset(): void {
        this._configChangeUnsub?.();
        this._controlPanel?.destroy();
        this._trafficFlowModule = undefined;
        this._trafficIncidentsModule = undefined;
        this._trafficAreaAnalyticsModule = undefined;
        this._lastAreaAnalytics = undefined;
        this._currentAnalyticsConfig = undefined;
        this._configChangeUnsub = undefined;
        this._controlPanel = undefined;
    }
}

export interface RangeEntry {
    id: string;
    timestamp: number;
    label: string;
    origin: { query?: string; position: Position };
    budgets: ReachableRangeBudget[];
    /** Raw polygon result for use in subsequent geometry searches. Not exposed to the agent. */
    polygon?: PolygonFeatures;
}

/**
 * State for reachable range results.
 *
 * Stores semantic summaries of calculated ranges (origin, budgets).
 * Also retains raw polygon geometry internally for use in geometry searches
 * (e.g. discoverPlaces withinRange). Displayed on the map via GeometriesModule.
 */
export class RangeState {
    private _entries: RangeEntry[] = [];
    private _placesModule?: PlacesModule;
    private _geometriesModule?: GeometriesModule;
    private _currentTheme?: GeometryTheme;

    constructor(private readonly _ttMap: TomTomMap) {}

    async getPlacesModule(): Promise<PlacesModule> {
        this._placesModule ??= await PlacesModule.get(this._ttMap);
        return this._placesModule;
    }

    async getGeometriesModule(theme: GeometryTheme): Promise<GeometriesModule> {
        if (!this._geometriesModule) {
            this._geometriesModule = await GeometriesModule.get(
                this._ttMap,
                reachableRangeGeometryConfig(undefined, theme),
            );
            this._currentTheme = theme;
        } else if (this._currentTheme !== theme) {
            this._geometriesModule.applyConfig(reachableRangeGeometryConfig(undefined, theme));
            this._currentTheme = theme;
        }
        return this._geometriesModule;
    }

    get geometriesModule(): GeometriesModule | undefined {
        return this._geometriesModule;
    }

    get entries(): readonly RangeEntry[] {
        return this._entries;
    }

    get latestEntry(): RangeEntry | undefined {
        return this._entries.at(-1);
    }

    addEntry(entry: Omit<RangeEntry, 'id' | 'timestamp'>): string {
        const id = `ranges-${this._entries.length}`;
        this._entries.push({
            id,
            timestamp: Date.now(),
            ...entry,
        });
        return id;
    }

    reset(): void {
        this._entries = [];
        this._geometriesModule = undefined;
        this._currentTheme = undefined;
    }
}

/**
 * Factory that creates a fully initialized ToolState from a TomTomMap instance.
 * Used internally by createMapAgent and in tests via createTestContext.
 */
export function createToolState(map: TomTomMap) {
    return {
        places: new PlacesState(map),
        mapPOIs: new MapPOIsState(map),
        routing: new RoutingState(map),
        baseMap: new BaseMapState(map),
        traffic: new TrafficState(map),
        ranges: new RangeState(map),
    };
}
