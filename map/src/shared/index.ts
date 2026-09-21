/**
 * @module map-base
 */

export * from './AbstractDataOwnedMapModule';
export * from './AbstractMapModule';
export * from './AbstractStyleOwnedMapModule';
export * from './CombinedEvents';
export * from './EventsProxy';
export * from './eventScope';
export * from './featureId';
export * from './knobs';
export {
    DEFAULT_TEXT_SIZE,
    MAP_BOLD_FONT,
    MAP_ITALIC_FONT,
    MAP_MEDIUM_FONT,
    MAP_REGULAR_FONT,
    type MapFont,
    mapFonts,
} from './layers/commonLayerProps';
export * from './layers/layerFilterComposer';
export * from './layers/layerIDs';
export * from './layers/sourcesIDs';
export * from './ModuleEvents';
export * from './SourceWithLayers';
export * from './sharedInstance';
export * from './TomTomMapSource';
export type * from './types';
export * from './UserEvents';
