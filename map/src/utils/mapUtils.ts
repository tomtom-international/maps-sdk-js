import { MapGeoJSONFeature, RequestParameters, ResourceType } from "maplibre-gl";
import { generateTomTomCustomHeaders } from "@anw/go-sdk-js/core";
import { GOSDKMap } from "../GOSDKMap";
import { GOSDKMapParams } from "../init/types/MapInit";
import { GeoJSONSourceWithLayers, SourceWithLayers } from "../core";
import { FeatureCollection } from "geojson";

/**
 * Wait until the map is ready
 * @param goSDKMap The GOSDKMap instance.
 * @returns {Promise<boolean>} Returns a Promise<boolean>
 */
export async function waitUntilMapIsReady(goSDKMap: GOSDKMap): Promise<boolean> {
    return new Promise((resolve) => {
        if (goSDKMap.mapReady || goSDKMap.mapLibreMap.isStyleLoaded()) {
            resolve(true);
        } else {
            goSDKMap.mapLibreMap.once("styledata", () => {
                resolve(true);
            });
        }
    });
}

/**
 * Deserialize the features properties queried by Maplibre.
 * Maplibre has a bug where all properties from a feature are stringified and not
 * serialized correct when queried.
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
    return;
};

/**
 * Inject TomTom custom headers to requests to TomTom.
 *
 * @ignore
 * @param goSDKParams Global SDK Map configuration
 */
export const injectCustomHeaders =
    (goSDKParams: GOSDKMapParams) =>
    (url: string, resourceType?: ResourceType): RequestParameters => {
        if (url.includes("tomtom.com")) {
            if (resourceType === "Image") {
                return { url };
            }

            const tomtomHeaders = generateTomTomCustomHeaders(goSDKParams);

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
 * Map features processed from Maplibre to.
 *
 * @ignore
 * @param mapModule An instance of GeoJSONSourceWithLayers.
 * @param rawFeature Feature returned by Maplibre queryRenderedFeatures method
 */
export const mapToInternalFeatures = <T extends FeatureCollection>(
    mapModule: GeoJSONSourceWithLayers<T>,
    rawFeature: MapGeoJSONFeature
) => {
    return mapModule.shownFeatures.features.find((feature) => feature.id === rawFeature.id);
};
