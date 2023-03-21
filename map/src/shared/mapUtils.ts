import { Map, MapGeoJSONFeature, RequestParameters, ResourceType } from "maplibre-gl";
import { generateTomTomCustomHeaders } from "@anw/maps-sdk-js/core";
import { TomTomMap } from "../TomTomMap";
import { TomTomMapParams } from "../init";

/**
 * Wait until the map is ready
 * @param tomtomMap The TomTomMap instance.
 * @returns {Promise<boolean>} Returns a Promise<boolean>
 */
export const waitUntilMapIsReady = async (tomtomMap: TomTomMap): Promise<boolean> =>
    new Promise((resolve) => {
        if (tomtomMap.mapReady || tomtomMap.mapLibreMap.isStyleLoaded()) {
            resolve(true);
        } else {
            tomtomMap.mapLibreMap.once("styledata", () => {
                resolve(true);
            });
        }
    });

/**
 * Deserializes the properties from MapLibre features.
 * * Maplibre has a bug where all properties from a feature are stringified.
 * See: {@link} https://github.com/maplibre/maplibre-gl-js/issues/1325
 *
 * @ignore
 * @param features An Array with MapGeoJSONFeatures objects
 */
export const deserializeFeatures = (features: MapGeoJSONFeature[]): void => {
    for (const feature of features) {
        if (!feature || Object.keys(feature.properties).length === 0) {
            return;
        }

        for (const key in feature.properties) {
            if (typeof feature.properties[key] === "string") {
                try {
                    feature.properties[key] = JSON.parse(feature.properties[key] as string);
                } catch (e) {
                    // We ignore the error if the object can't be parsed and continue.
                }
            }
        }
    }
};

/**
 * Inject TomTom custom headers to requests to TomTom.
 *
 * @ignore
 * @param tomtomMapParams Global SDK Map configuration
 */
export const injectCustomHeaders =
    (tomtomMapParams: TomTomMapParams) =>
    (url: string, resourceType?: ResourceType): RequestParameters => {
        if (url.includes("tomtom.com")) {
            if (resourceType === "Image") {
                return { url };
            }

            const tomtomHeaders = generateTomTomCustomHeaders(tomtomMapParams);

            return {
                url,
                headers: {
                    ...tomtomHeaders
                }
            };
        } else {
            return { url };
        }
    };

/**
 * Compares two MapLibre features by reference or ID.
 * @ignore
 */
export const areBothDefinedAndEqual = (
    featureA: MapGeoJSONFeature | undefined,
    featureB: MapGeoJSONFeature | undefined
): boolean => !!featureA && !!featureB && featureA.id == featureB.id;

type LayoutPaint = { id: string; layout?: any; paint?: any };

/**
 * Applies the layout and paint properties from newLayoutPaint
 * while unsetting (setting as undefined) the ones from previousSpec which no longer exist in newLayoutPaint.
 * * This allows for a quick change of a layer visuals without removing-re-adding the layer.
 * @ignore
 * @param newLayoutPaint The new layer from which to apply layout/pain props.
 * @param prevLayoutPaint The previous layer to ensure layout/paint props are removed.
 * @param map
 */
export const changeLayoutAndPaintProps = (newLayoutPaint: LayoutPaint, prevLayoutPaint: LayoutPaint, map: Map) => {
    const layerID = newLayoutPaint.id;
    for (const property of Object.keys(prevLayoutPaint.layout || [])) {
        if (!newLayoutPaint.layout?.[property]) {
            map.setLayoutProperty(layerID, property, undefined, { validate: false });
        }
    }
    for (const property of Object.keys(prevLayoutPaint.paint || [])) {
        if (!newLayoutPaint.paint?.[property]) {
            map.setPaintProperty(layerID, property, undefined, { validate: false });
        }
    }
    for (const [property, value] of Object.entries(newLayoutPaint.paint || [])) {
        map.setPaintProperty(layerID, property, value, { validate: false });
    }

    for (const [property, value] of Object.entries(newLayoutPaint.layout || [])) {
        map.setLayoutProperty(layerID, property, value, { validate: false });
    }
};

/**
 * Applies the layout and paint properties from each layer of newLayoutPaints
 * while unsetting (setting as undefined) the ones from the corresponding layer from prevLayoutPaints
 * which no longer exist in the new one.
 * * The two layer inputs are expected to be parallel arrays.
 * * This allows for quick changes of layer visuals without removing-re-adding the layers.
 * @ignore
 */
export const changeLayoutsAndPaintsProps = (
    newLayoutPaints: LayoutPaint[],
    prevLayoutPaints: LayoutPaint[],
    map: Map
) => {
    newLayoutPaints.forEach((layoutPaint, index) =>
        changeLayoutAndPaintProps(layoutPaint, prevLayoutPaints[index], map)
    );
};
