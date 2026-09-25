/**
 * @module map-styling
 */

export {
    type StylingColorKnobId,
    type StylingKnobId,
    type StylingKnobValueOf,
    stylingColorKnobIds,
    stylingKnobIds,
} from './knobCatalogue';
export { type MapColorName, type MapColors, mapColorNames } from './mapColorCatalogue';
export { type StylingPresetId, stylingPresetIds } from './presets';
export * from './StylingModule';
export type * from './types/stylingTypes';
export { stylingKnobAppliesTo, stylingKnobKinds } from './types/stylingTypes';
