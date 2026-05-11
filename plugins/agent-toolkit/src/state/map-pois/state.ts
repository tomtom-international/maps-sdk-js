/**
 * @module agent-toolkit-state
 */

import { POIsModule, type TomTomMap } from '@tomtom-org/maps-sdk/map';
import type { StateSlice } from '../../types';

/**
 * State for the map POI layer (points of interest overlay).
 *
 * Holds the lazy-initialized POIsModule for showing, hiding, and filtering
 * the built-in POI categories rendered on the base map.
 *
 * @group Agent Toolkit
 */
export class MapPOIsState implements StateSlice {
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
