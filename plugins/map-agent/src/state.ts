/**
 * @module map-agent-state
 */

import type { Place, Places, Routes, WaypointLike } from '@tomtom-org/maps-sdk/core';
import { TomTomConfig } from '@tomtom-org/maps-sdk/core';
import {
    BaseMapModule,
    GeometriesModule,
    HillshadeModule,
    PlacesModule,
    POIsModule,
    RoutingModule,
    type TomTomMap,
    TrafficFlowModule,
    TrafficIncidentsModule,
} from '@tomtom-org/maps-sdk/map';

TomTomConfig.instance.put({ language: 'en-GB' });

/**
 * State container for TomTom service response data.
 *
 * This class holds the results from various TomTom API service calls
 * (search, routing, geocoding) so they can be accessed by map tools
 * without re-fetching.
 */
export class TomTomServiceResponses {
    private _searchResultsHistory: Places[] = [];
    private _routesHistory: Routes[] = [];
    private _waypointsHistory: WaypointLike[][] = [];
    private _geocodedResultsHistory: Place[] = [];
    private _reverseGeocodedResultsHistory: Place[] = [];
    private _placesHistory: (Place | Places)[] = [];

    // Places history (aggregates search, geocode, and reverse geocode results)
    get placesHistory(): (Place | Places)[] {
        return this._placesHistory;
    }

    get lastPlaces(): Place | Places | undefined {
        return this._placesHistory.at(-1);
    }

    get previousPlaces(): (Place | Places)[] {
        return this._placesHistory.slice(0, -1);
    }

    private addToPlacesHistory(place: Place | Places): void {
        this._placesHistory.push(place);
    }

    clearPlacesHistory(): void {
        this._placesHistory = [];
    }

    // Search results history
    get searchResultsHistory(): Places[] {
        return this._searchResultsHistory;
    }

    get lastSearchResults(): Places | undefined {
        return this._searchResultsHistory.at(-1);
    }

    get previousSearchResults(): Places[] {
        return this._searchResultsHistory.slice(0, -1);
    }

    addSearchResults(results: Places): void {
        this._searchResultsHistory.push(results);
        this.addToPlacesHistory(results);
    }

    clearSearchResultsHistory(): void {
        this._searchResultsHistory = [];
    }

    // Routes history
    get routesHistory(): Routes[] {
        return this._routesHistory;
    }

    get lastRoutes(): Routes | undefined {
        return this._routesHistory.at(-1);
    }

    get previousRoutes(): Routes[] {
        return this._routesHistory.slice(0, -1);
    }

    addRoutes(routes: Routes): void {
        this._routesHistory.push(routes);
    }

    clearRoutesHistory(): void {
        this._routesHistory = [];
    }

    // Waypoints history
    get waypointsHistory(): WaypointLike[][] {
        return this._waypointsHistory;
    }

    get lastWaypoints(): WaypointLike[] | undefined {
        return this._waypointsHistory.at(-1);
    }

    get previousWaypoints(): WaypointLike[][] {
        return this._waypointsHistory.slice(0, -1);
    }

    addWaypoints(waypoints: WaypointLike[]): void {
        this._waypointsHistory.push(waypoints);
    }

    clearWaypointsHistory(): void {
        this._waypointsHistory = [];
    }

    // Geocoded results history
    get geocodedResultsHistory(): Place[] {
        return this._geocodedResultsHistory;
    }

    get lastGeocodedResult(): Place | undefined {
        return this._geocodedResultsHistory.at(-1);
    }

    get previousGeocodedResults(): Place[] {
        return this._geocodedResultsHistory.slice(0, -1);
    }

    addGeocodedResult(result: Place): void {
        this._geocodedResultsHistory.push(result);
        this.addToPlacesHistory(result);
    }

    clearGeocodedResultsHistory(): void {
        this._geocodedResultsHistory = [];
    }

    // Reverse geocoded results history
    get reverseGeocodedResultsHistory(): Place[] {
        return this._reverseGeocodedResultsHistory;
    }

    get lastReverseGeocodedResult(): Place | undefined {
        return this._reverseGeocodedResultsHistory.at(-1);
    }

    get previousReverseGeocodedResults(): Place[] {
        return this._reverseGeocodedResultsHistory.slice(0, -1);
    }

    addReverseGeocodedResult(result: Place): void {
        this._reverseGeocodedResultsHistory.push(result);
        this.addToPlacesHistory(result);
    }

    clearReverseGeocodedResultsHistory(): void {
        this._reverseGeocodedResultsHistory = [];
    }

    /**
     * Reset all service response data to initial state.
     */
    reset(): void {
        this._searchResultsHistory = [];
        this._routesHistory = [];
        this._waypointsHistory = [];
        this._geocodedResultsHistory = [];
        this._reverseGeocodedResultsHistory = [];
        this._placesHistory = [];
    }
}

/**
 * Internal state maintained by the map agent across tool calls.
 *
 * This state manages map modules and provides lazy initialization.
 * Module instances are cached for reuse.
 */
export class TomTomMapWithModules {
    private _modules: {
        places?: PlacesModule;
        routing?: RoutingModule;
        trafficFlow?: TrafficFlowModule;
        trafficIncidents?: TrafficIncidentsModule;
        pois?: POIsModule;
        geometries?: GeometriesModule;
        baseMap?: BaseMapModule;
        hillshade?: HillshadeModule;
    } = {};

    constructor(public readonly ttMap: TomTomMap) {}

    /**
     * Convenience accessor for the MapLibre map instance.
     */
    get mapLibreMap() {
        return this.ttMap.mapLibreMap;
    }

    /**
     * Get or lazily initialize the PlacesModule.
     */
    async getPlacesModule(): Promise<PlacesModule> {
        this._modules.places ??= await PlacesModule.get(this.ttMap);
        return this._modules.places;
    }

    /**
     * Get or lazily initialize the RoutingModule.
     */
    async getRoutingModule(): Promise<RoutingModule> {
        this._modules.routing ??= await RoutingModule.get(this.ttMap);
        return this._modules.routing;
    }

    /**
     * Get or lazily initialize the TrafficFlowModule.
     */
    async getTrafficFlowModule(): Promise<TrafficFlowModule> {
        this._modules.trafficFlow ??= await TrafficFlowModule.get(this.ttMap);
        return this._modules.trafficFlow;
    }

    /**
     * Get or lazily initialize the TrafficIncidentsModule.
     */
    async getTrafficIncidentsModule(): Promise<TrafficIncidentsModule> {
        this._modules.trafficIncidents ??= await TrafficIncidentsModule.get(this.ttMap);
        return this._modules.trafficIncidents;
    }

    /**
     * Get or lazily initialize the POIsModule.
     */
    async getPOIsModule(): Promise<POIsModule> {
        this._modules.pois ??= await POIsModule.get(this.ttMap);
        return this._modules.pois;
    }

    /**
     * Get or lazily initialize the GeometriesModule.
     */
    async getGeometriesModule(): Promise<GeometriesModule> {
        this._modules.geometries ??= await GeometriesModule.get(this.ttMap);
        return this._modules.geometries;
    }

    /**
     * Get or lazily initialize the BaseMapModule.
     */
    async getBaseMapModule(): Promise<BaseMapModule> {
        this._modules.baseMap ??= await BaseMapModule.get(this.ttMap);
        return this._modules.baseMap;
    }

    /**
     * Get or lazily initialize the HillshadeModule.
     */
    async getHillshadeModule(): Promise<HillshadeModule> {
        this._modules.hillshade ??= await HillshadeModule.get(this.ttMap);
        return this._modules.hillshade;
    }

    /**
     * Access to module cache for conditional checks (e.g., in clear-map tool).
     * @internal
     */
    get modules() {
        return this._modules;
    }

    /**
     * Reset the agent state, clearing all cached modules.
     */
    reset(): void {
        // Clear module references
        this._modules = {};
    }
}
