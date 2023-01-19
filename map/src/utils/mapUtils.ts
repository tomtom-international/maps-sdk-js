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
