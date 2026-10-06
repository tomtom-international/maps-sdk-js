import { getPosition } from '@tomtom-org/maps-sdk/core';
import type { ToolState } from '@tomtom-org/maps-sdk-plugin-agent-toolkit';
import type { Feature, Point } from 'geojson';

// Bridge so the React panels (which read the results store) can also drive the shared map — used for
// "click a row → fly to it" and for re-running an analysis with tweaked params from a panel control.
// The agent owns the single ToolState; the bootstrap registers it here once the agent is created.

let active: ToolState | null = null;

export const setActiveToolState = (state: ToolState | null): void => {
    active = state;
};

export const getActiveToolState = (): ToolState | null => active;

/** Fly the shared map to a coordinate — for "click a panel row to see it on the map". */
export const focusMap = (center: [number, number], zoom = 14): void => {
    active?.baseMap.mapLibreMap.flyTo({ center, zoom, duration: 600 });
};

/** Fly to a Point feature (e.g. a result site/pocket) — unwraps its coordinates via getPosition. */
export const focusFeature = (feature: Feature<Point>, zoom = 14): void => {
    const position = getPosition(feature);
    if (position) focusMap([position[0], position[1]], zoom);
};
