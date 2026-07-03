/**
 * Style-like specification for a {@link ModelsLayer}, mirroring the shape of a
 * MapLibre layer definition so 3D model layers can be configured declaratively.
 *
 * @group Landmarks 3D
 */
export interface ModelsLayerSpecification {
    id: string;
    type: 'models';
    source: string;
    before?: string;
    minzoom?: number;
    maxzoom?: number;
    paint?: {
        'models-base-color'?: string;
    };
    layout?: {
        visibility?: 'visible' | 'none';
    };
}

/**
 * Style-like specification for a {@link ModelsSource}: a tiled source of
 * glTF/GLB models, mirroring the shape of a MapLibre raster/vector source definition.
 *
 * @group Landmarks 3D
 */
export interface ModelsSourceSpecification {
    type: 'models';
    tiles: Array<string>;
    bounds?: [number, number, number, number];
    scheme?: 'xyz' | 'tms';
    minzoom?: number;
    maxzoom?: number;
    attribution?: string;
    /**
     * Base path of the Basis Universal transcoder used to decode KTX2 textures.
     * Defaults to the three.js examples CDN path on unpkg; point this at a
     * self-hosted copy when external CDNs are not an option (e.g. strict CSP).
     */
    transcoderPath?: string;
    /**
     * Send `credentials: 'include'` with each tile request so a session cookie
     * (e.g. the demo-BFF proxy's) travels with it. Leave off for direct
     * `api.tomtom.com` access, where credentialed CORS would fail.
     * @defaultValue `false`
     */
    withCredentials?: boolean;
}
