/**
 * @module agent-toolkit-state
 */

import { BaseMapModule, HillshadeModule, type TomTomMap } from '@tomtom-org/maps-sdk/map';
import type { Map as MapLibreMap } from 'maplibre-gl';
import type { StateSlice } from '../../types';

/**
 * State for base map display: style, language, viewport, layers, and hillshade.
 *
 * Provides direct access to the TomTomMap and MapLibre instances alongside
 * lazy-initialized BaseMapModule and HillshadeModule.
 *
 * @group Agent Toolkit
 */
export class BaseMapState implements StateSlice {
    private _baseMapModule?: BaseMapModule;
    private _hillshadeModule?: HillshadeModule;

    constructor(public readonly ttMap: TomTomMap) {}

    get mapLibreMap(): MapLibreMap {
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
