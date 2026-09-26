/**
 * @module agent-toolkit-state
 */

import { BaseMapModule, StylingModule, type TomTomMap } from '@tomtom-org/maps-sdk/map';
import type { Map as MapLibreMap } from 'maplibre-gl';
import type { StateSlice } from '../../types';

/**
 * State for base map display: style, language, viewport and layers.
 *
 * Provides direct access to the TomTomMap and MapLibre instances alongside
 * lazy-initialized BaseMapModule and StylingModule.
 *
 * @group Agent Toolkit
 */
export class BaseMapState implements StateSlice {
    private _baseMapModule?: BaseMapModule;
    private _stylingModule?: StylingModule;

    constructor(public readonly ttMap: TomTomMap) {}

    get mapLibreMap(): MapLibreMap {
        return this.ttMap.mapLibreMap;
    }

    // Module getters. The SDK shares style-owned modules per map, so these are lookups —
    // the field only records that we have fetched it, for the synchronous accessors below.

    async getBaseMapModule(): Promise<BaseMapModule> {
        this._baseMapModule = await BaseMapModule.get(this.ttMap);
        return this._baseMapModule;
    }

    async getStylingModule(): Promise<StylingModule> {
        this._stylingModule = await StylingModule.get(this.ttMap);
        return this._stylingModule;
    }

    reset(): void {
        this._baseMapModule = undefined;
        this._stylingModule = undefined;
    }
}
