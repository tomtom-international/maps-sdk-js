import type { MapEffectsConfig } from '@tomtom-org/maps-sdk-plugin-map-effects';

/** A grey city with the traffic burning through it, tuned against `monoDark`. */
export const BLOOM_LOOK: MapEffectsConfig = {
    bloom: {
        intensity: 0.95,
        radius: 13,
        // Low, because the scope already keeps the city out: a `monoDark` major jam keeps 110/255 of
        // itself above a 0.25 cut, against 64/255 above 0.45.
        threshold: 0.25,
        only: ['traffic'],
    },
    // Added light reads as light only against a dark, colourful ground.
    grade: { contrast: 1.45, saturation: 1.5 },
};

// A glow can only spread what the map drew: a wider tube is a lit road rather than a bright hairline.
export const FLOW_WIDTH_FACTOR = 1.35;
