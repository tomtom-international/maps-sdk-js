import { TomTomConfig } from '@tomtom-org/maps-sdk/core';

const LANDMARKS_API_VERSION = 2;

/**
 * Builds the TomTom Orbis 3D Landmarks tile URL template.
 *
 * @remarks
 * The API serves meshopt-compressed GLB tiles with KTX2/Basis textures and requires
 * an API key with Orbis 3D Landmarks entitlements (still in Private Preview).
 *
 * @group Landmarks 3D
 */
export const buildLandmarksTileURL = (): string => {
    const { commonBaseURL, apiKey } = TomTomConfig.instance.get();
    // Proxy mode passes apiKey='' and lets the proxy inject the real key server-side —
    // skip the param so the proxy key never reaches the browser.
    const keyParam = apiKey ? `key=${apiKey}&` : '';
    return `${commonBaseURL}/maps/orbis/display/3d/landmarks/tile/{z}/{x}/{y}?${keyParam}apiVersion=${LANDMARKS_API_VERSION}`;
};
