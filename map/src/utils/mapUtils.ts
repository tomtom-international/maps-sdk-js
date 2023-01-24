import { MapGeoJSONFeature } from "maplibre-gl";
import { GOSDKMap } from "../GOSDKMap";

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
export function deserializeFeatures(features: MapGeoJSONFeature[]) {
    for (const feature of features) {
        if (!feature || Object.keys(feature.properties).length === 0) {
            return feature;
        }

        for (const key in feature.properties) {
            if (typeof feature.properties[key] === "string") {
                try {
                    feature.properties[key] = JSON.parse(feature.properties[key] as string);
                } catch (e) {
                    // We ignore the error if the object can't be parsed and continue.
                    continue;
                }
            }
        }
    }
    return features;
}
