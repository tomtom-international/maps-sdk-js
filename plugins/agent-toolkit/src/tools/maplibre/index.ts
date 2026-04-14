/**
 * @module agent-toolkit-tools/maplibre
 *
 * MapLibre tools - MapLibre-specific features like getting style details and updating layout/paint properties.
 */

export {
    executeExecuteMaplibreCode,
    executeMaplibreCodeDescription,
    executeMaplibreCodeOutputSchema,
    executeMaplibreCodeSchema,
} from './execute-maplibre-code';
export { executeFlyTo, flyToDescription, flyToOutputSchema, flyToSchema } from './fly-to';
export {
    executeGetMapStyleLayers,
    getMapStyleLayersDescription,
    getMapStyleLayersOutputSchema,
    getMapStyleLayersSchema,
} from './get-map-style-layers';
export {
    executeGetViewport,
    getViewportDescription,
    getViewportOutputSchema,
    getViewportSchema,
} from './get-viewport';
export {
    executeSetLayoutProperties,
    setLayoutPropertiesDescription,
    setLayoutPropertiesOutputSchema,
    setLayoutPropertiesSchema,
} from './set-layout-properties';
export {
    executeSetPaintProperties,
    setPaintPropertiesDescription,
    setPaintPropertiesOutputSchema,
    setPaintPropertiesSchema,
} from './set-paint-properties';
export {
    executeSetPitchBearing,
    setPitchBearingDescription,
    setPitchBearingOutputSchema,
    setPitchBearingSchema,
} from './set-pitch-bearing';
export {
    executeZoomInOrOut,
    zoomInOrOutDescription,
    zoomInOrOutOutputSchema,
    zoomInOrOutSchema,
} from './zoom-in-or-out';
