import type { GlobalConfig } from '@tomtom-org/maps-sdk/core';
import { generateTomTomHeaders } from '@tomtom-org/maps-sdk/core';
import type {
    FilterSpecification,
    Map,
    MapGeoJSONFeature,
    RequestParameters,
    ResourceType,
    StyleImageMetadata,
} from 'maplibre-gl';
import { InternalTomTomMapParams, StandardStyle, StandardStyleID, StyleInput, StyleModule } from '../init';
import type { TomTomMap } from '../TomTomMap';
import { FLOW_TAGS } from '../traffic/util/trafficFlowMapping';
import { INCIDENT_TAGS } from '../traffic/util/trafficIncidentMapping';
import { cannotAddStyleModuleToCustomStyle } from './errorMessages';
import { svgToImg } from './imageUtils';
import { parseSvg } from './resources';
import { AbstractSourceWithLayers, filterLayersBySources } from './SourceWithLayers';
import type { LightDark, ToBeAddedLayerSpec, ToBeAddedLayerSpecWithoutSource } from './types';

/**
 * Wait until the map is ready.
 * @param tomtomMap The TomTomMap instance.
 * @returns {Promise<boolean>} Returns a Promise<boolean>
 */
export const waitUntilMapIsReady = async (tomtomMap: TomTomMap): Promise<void> => {
    if (!tomtomMap.mapReady) {
        await tomtomMap.mapLibreMap.once('styledata');
        // Recursively waiting for map to be ready (in case of style changes quickly in succession):
        await waitUntilMapIsReady(tomtomMap);
    }
};

/**
 * Wait until the source is ready.
 * @param tomtomMap The TomTomMap instance.
 * @param sourceId we want to check for.
 * @returns {Promise<boolean>} Returns a Promise<boolean>
 */
export const waitUntilSourceIsLoaded = async (tomtomMap: TomTomMap, sourceId: string): Promise<void> => {
    if (!tomtomMap.mapLibreMap.getSource(sourceId) || !tomtomMap.mapLibreMap.isSourceLoaded(sourceId)) {
        await tomtomMap.mapLibreMap.once('sourcedata');
    }
};

const TOMTOM_DEFAULT_URL = 'https://api.tomtom.com';

const isTomTomHostname = (hostname: string): boolean =>
    hostname === 'api.tomtom.com' || hostname.endsWith('.api.tomtom.com');

/**
 * Vector tiles are served from prefixed-subdomain CDN hosts
 * (a./b./c./d.api.tomtom.com) for browser-parallelism. Rewrite all of those
 * plus the bare `api.tomtom.com` host to the proxy. In demo-BFF mode
 * (`isDemoBffMode`) drop any inbound `key` param too: TomTom's edge bakes
 * the request's key into tile URLs returned in the style JSON, and the
 * proxy injects its own server-side — leaving the client-visible key would
 * just leak it to the browser console.
 *
 * Returns the original URL unchanged when it isn't a TomTom host or when
 * we're not in proxy mode.
 */
const rewriteForProxy = (url: string, baseURL: string, isProxyMode: boolean, isDemoBffMode: boolean): string => {
    if (!isProxyMode) return url;
    try {
        const parsed = new URL(url);
        if (!isTomTomHostname(parsed.hostname)) return url;
        if (isDemoBffMode) {
            parsed.searchParams.delete('key');
        }
        return baseURL + parsed.pathname + parsed.search + parsed.hash;
    } catch {
        return url;
    }
};

/**
 * For traffic-incident / traffic-flow tile endpoints, override the
 * server-side `tags` filter to the SDK's tracked-incident set so MapLibre
 * gets the data the SDK actually knows how to render.
 */
const injectTrafficTags = (url: URL): void => {
    if (url.pathname.includes('incidents')) {
        url.searchParams.set('tags', INCIDENT_TAGS.join(','));
    } else if (url.pathname.includes('flow')) {
        url.searchParams.set('tags', FLOW_TAGS.join(','));
    }
};

declare global {
    /**
     * Installed by the demo-BFF sandpack bootstrap. Resolves once the proxy
     * session cookie is valid and not about to expire, re-minting it first
     * when needed. See ensureFreshSession in proxyBootstrap.ts. Declared as a
     * global var (not a Window member) so it can be read off `globalThis`,
     * which also works on the main thread where window === globalThis.
     */
    var __DEMO_BFF_ENSURE_SESSION__: (() => Promise<void>) | undefined;
}

/**
 * Gate a request on a fresh demo-BFF session when the bootstrap installed
 * its hook. MapLibre awaits transformRequest results on the MAIN thread
 * before handing the request to its tile worker — which makes this the one
 * place that can hold back worker-fetched tiles until the session cookie is
 * renewed (the workers' own `fetch` is unreachable from here; they rely on
 * the browser attaching whatever cookie exists when the request starts).
 * Without the hook (direct mode, non-sandpack consumers) this stays fully
 * synchronous. A failed renewal lets the request proceed (it will 401, same
 * as without the gate) rather than wedging the map.
 * @ignore
 */
const gateOnDemoBffSession = (result: RequestParameters): RequestParameters | Promise<RequestParameters> => {
    const ensureSession = globalThis.__DEMO_BFF_ENSURE_SESSION__;
    if (typeof ensureSession !== 'function') return result;
    return ensureSession().then(
        () => result,
        () => result,
    );
};

/**
 * Inject TomTom custom headers (and, when a proxy `commonBaseURL` is
 * configured, rewrite tile URLs + attach credentials) on requests issued
 * by MapLibre.
 *
 * In "proxy mode" (commonBaseURL points away from api.tomtom.com), tile
 * URLs baked into the style JSON still arrive here as `api.tomtom.com/...`
 * because MapLibre fetches them directly. We rewrite them to flow through
 * the configured base URL, and — in demo-BFF mode — set
 * `credentials: 'include'` so the session cookie travels with each tile.
 *
 * @ignore
 * @param params Global SDK Map configuration
 */
export const transformRequest = (params: Partial<GlobalConfig>) => {
    const baseURL = params.commonBaseURL ?? TOMTOM_DEFAULT_URL;
    // commonBaseURL points at something other than TomTom — could be a
    // demo-BFF or a customer's own customServiceBaseURL. We always rewrite
    // tile hostnames to flow through it.
    const isProxyMode = baseURL !== TOMTOM_DEFAULT_URL;
    // Demo-BFF-style mode: no apiKey signals the proxy will inject the real
    // key server-side from a cookie-gated session. Customers using
    // customServiceBaseURL keep apiKey set so their backend can use it.
    // We only strip key= and attach `credentials: 'include'` in this mode;
    // doing it for customServiceBaseURL would break consumers whose backend
    // serves CORS as `Access-Control-Allow-Origin: *`.
    //
    // Falsy check (not `=== ''`) on purpose: an example may overwrite the
    // proxy bootstrap's `apiKey: ''` with `apiKey: undefined` via
    // `put({ apiKey: process.env.API_KEY_EXAMPLES })` when that env is unset
    // in a proxy build. Both empty and undefined mean "no key"; this matches
    // the URL builders' `if (apiKey)` key-append decision.
    const isDemoBffMode = isProxyMode && !params.apiKey;

    return (url: string, resourceType?: ResourceType): RequestParameters | Promise<RequestParameters> => {
        const rewrittenUrl = rewriteForProxy(url, baseURL, isProxyMode, isDemoBffMode);
        const isProxyUrl = isProxyMode && rewrittenUrl.startsWith(baseURL);
        const useCredentials = isDemoBffMode && isProxyUrl;

        // Hostname-based TomTom detection — a substring check like
        // `url.includes('tomtom.com')` would also match lookalikes
        // (`tomtom.com.evil.example`) or a `tomtom.com` in the query string,
        // and then run TomTom header/tag injection on unintended hosts. Match
        // the registrable domain (tomtom.com or any *.tomtom.com subdomain) by
        // hostname — broader than the api-only `isTomTomHostname` used for the
        // rewrite, since headers apply to all genuine TomTom hosts. The
        // try/catch guards against invalid/relative URLs.
        let isTomTomUrl = false;
        try {
            const host = new URL(url).hostname;
            isTomTomUrl = host === 'tomtom.com' || host.endsWith('.tomtom.com');
        } catch {
            isTomTomUrl = false;
        }

        if (!isTomTomUrl && !isProxyUrl) {
            return { url: rewrittenUrl };
        }

        if (resourceType === 'Image') {
            return useCredentials
                ? gateOnDemoBffSession({ url: rewrittenUrl, credentials: 'include' })
                : { url: rewrittenUrl };
        }

        const parsedUrl = new URL(rewrittenUrl);
        injectTrafficTags(parsedUrl);

        const result: RequestParameters = {
            url: parsedUrl.toString(),
            headers: { ...generateTomTomHeaders(params) },
        };
        if (useCredentials) {
            result.credentials = 'include';
            return gateOnDemoBffSession(result);
        }
        return result;
    };
};

/**
 * Compares two MapLibre features by ID.
 * @ignore
 */
export const areBothDefinedAndEqual = (
    featureA: MapGeoJSONFeature | undefined,
    featureB: MapGeoJSONFeature | undefined,
): boolean => !!featureA && !!featureB && featureA.id === featureB.id;

type LayerProps = {
    id: string;
    layout?: any;
    paint?: any;
    minzoom?: number;
    maxzoom?: number;
    filter?: FilterSpecification;
};

/**
 * Applies the layout and paint properties from newLayoutPaint
 * while unsetting (setting as undefined) the ones from previousSpec which no longer exist in newLayoutPaint.
 * * This allows for a quick change of a layer visuals without removing-re-adding the layer.
 * @ignore
 * @param newLayerProps The new layer from which to apply layout/pain props.
 * @param prevLayerProps The previous layer to ensure layout/paint props are removed.
 * @param map
 */
export const changeLayerProps = (newLayerProps: LayerProps, prevLayerProps: LayerProps, map: Map) => {
    const layerId = newLayerProps.id;
    if (newLayerProps.maxzoom !== prevLayerProps.maxzoom || newLayerProps.minzoom !== prevLayerProps.minzoom) {
        map.setLayerZoomRange(
            layerId,
            newLayerProps.minzoom ?? map.getMinZoom(),
            newLayerProps.maxzoom ?? map.getMaxZoom(),
        );
    }
    map.setFilter(layerId, newLayerProps.filter, { validate: false });
    for (const property of Object.keys(prevLayerProps.layout ?? [])) {
        if (!newLayerProps.layout?.[property]) {
            map.setLayoutProperty(layerId, property, undefined, { validate: false });
        }
    }
    for (const property of Object.keys(prevLayerProps.paint ?? [])) {
        if (!newLayerProps.paint?.[property]) {
            map.setPaintProperty(layerId, property, undefined, { validate: false });
        }
    }
    for (const [property, value] of Object.entries(newLayerProps.paint ?? [])) {
        map.setPaintProperty(layerId, property, value, { validate: false });
    }

    for (const [property, value] of Object.entries(newLayerProps.layout ?? [])) {
        map.setLayoutProperty(layerId, property, value, { validate: false });
    }
};

/**
 * Applies the layer properties from each layer of newLayoutPaints
 * while unsetting (setting as undefined) the ones from the corresponding layer from prevLayoutPaints
 * which no longer exist in the new one.
 * * The two layer inputs are expected to be parallel arrays.
 * * This allows for quick changes of layer visuals without removing-re-adding the layers.
 * @ignore
 */
export const changeLayersProps = (newLayerProps: LayerProps[], prevLayerProps: LayerProps[], map: Map) => {
    newLayerProps.forEach((layoutPaint, index) => changeLayerProps(layoutPaint, prevLayerProps[index], map));
};

/**
 * Handles new layer specs for the provided source. It will remove layers no longer present,
 * update existing layers and add new one if needed to the source.
 * Adding layers to the map needs to be done correctly, so after calling this method, you should call addLayersInCorrectOrder.
 * If ID of layer to be added already is present on map, MapLibre will through exception.
 * @param newLayersSpecs new layer specification for provided source.
 * @param oldLayersSpecs current layer specification for provided source.
 * @param sourceWithLayers provided source that contains layers.
 * @param map provided map libre map object.
 * @ignore
 */
export const updateLayersAndSource = (
    newLayersSpecs: ToBeAddedLayerSpecWithoutSource[],
    oldLayersSpecs: ToBeAddedLayerSpecWithoutSource[],
    sourceWithLayers: AbstractSourceWithLayers,
    map: Map,
): void => {
    // map layers by id in object for easier access, reduces number of loops
    const newLayersMap: Record<string, ToBeAddedLayerSpecWithoutSource> = newLayersSpecs.reduce(
        (acc, cur) => ({ ...acc, [cur.id]: cur }),
        {},
    );
    const oldLayersMap: Record<string, ToBeAddedLayerSpecWithoutSource> = oldLayersSpecs.reduce(
        (acc, cur) => ({ ...acc, [cur.id]: cur }),
        {},
    );

    // we need to store layers in four arrays, layers to add ID, layers to remove ID and layers to update
    const layersToAdd: string[] = [];
    const layersToRemove: string[] = [];
    const newLayersToUpdate: ToBeAddedLayerSpecWithoutSource[] = [];
    const oldLayersToUpdate: ToBeAddedLayerSpecWithoutSource[] = [];
    Object.keys(newLayersMap).forEach((key) => {
        if (oldLayersMap[key]) {
            newLayersToUpdate.push(newLayersMap[key]);
            oldLayersToUpdate.push(oldLayersMap[key]);
        } else {
            layersToAdd.push(key);
        }
    });
    Object.keys(oldLayersMap).forEach((key) => {
        if (!newLayersMap[key]) {
            layersToRemove.push(key);
        }
    });

    // remove the old layers no longer present in new layer specification
    const layerSpecs: ToBeAddedLayerSpec[] = sourceWithLayers._layerSpecs;
    layersToRemove.forEach((layerId) => {
        map.removeLayer(layerId);
        for (let i = 0; i < layerSpecs.length; i++) {
            if (layerSpecs[i].id === layerId) {
                layerSpecs.splice(i, 1);
                break;
            }
        }
    });
    // add new layers
    layersToAdd.forEach((layerId) => {
        // add layer spec and map
        const toBeAddedLayerSpec: ToBeAddedLayerSpec = {
            ...newLayersMap[layerId],
            source: sourceWithLayers.source.id,
        } as ToBeAddedLayerSpec;
        layerSpecs.push(toBeAddedLayerSpec);
    });
    sourceWithLayers._updateSourceAndLayerIDs();
    // update existing layers
    changeLayersProps(newLayersToUpdate, oldLayersToUpdate, map);
};

/**
 * Adds the given layers to the map ensuring they respect their "beforeID" properties.
 * * We need to make sure that layers are added in the correct Z order because one layer may depend on another layer.
 * @param layersToAdd
 * @param map MapLibre map
 * @ignore
 */
export const addLayers = (layersToAdd: ToBeAddedLayerSpec[], map: Map): void => {
    const layerIdsAlreadyOnMap = new Set<string>();
    const addLayer = (layer: ToBeAddedLayerSpec): void => {
        // we can safely add this layer
        if (!map.getLayer(layer.id)) {
            map.addLayer({ ...layer, layout: { ...layer.layout, visibility: 'none' } }, layer.beforeID);
        }
        layerIdsAlreadyOnMap.add(layer.id);
    };

    const mapIdDependency: Record<string, ToBeAddedLayerSpec[]> = {};

    layersToAdd.forEach((layer) => {
        if (layer.beforeID) {
            if (layerIdsAlreadyOnMap.has(layer.beforeID) || map.getLayer(layer.beforeID)) {
                layerIdsAlreadyOnMap.add(layer.beforeID);
                addLayer(layer);
            } else if (mapIdDependency[layer.beforeID]) {
                // we cannot add this layer yet
                mapIdDependency[layer.beforeID].push(layer);
            } else {
                mapIdDependency[layer.beforeID] = [layer];
            }
        } else {
            addLayer(layer);
        }
    });

    // try to process the rest of layers
    while (Object.keys(mapIdDependency).length > 0) {
        const idsWeCanProcess = Object.keys(mapIdDependency).filter((id) => layerIdsAlreadyOnMap.has(id));
        if (!idsWeCanProcess.length) {
            console.error(
                `Some layers cannot be added. Check for non-existing layers, or circular beforeID dependencies for the following: ${JSON.stringify(Object.keys(mapIdDependency))}`,
            );
            return;
        }
        idsWeCanProcess.forEach((id) => {
            mapIdDependency[id].forEach((layer) => addLayer(layer));
            delete mapIdDependency[id];
        });
    }
};

/**
 * Adding a style-based module to the given style input, if possible.
 * * This results in a style input which will include such style-based module (e.g. include traffic layers).
 * @param style which we want to update.
 * @param styleModule module we want to add.
 * @ignore
 */
export const updateStyleWithModule = (style: StyleInput | undefined, styleModule: StyleModule): StyleInput => {
    switch (typeof style) {
        case 'undefined':
            return { type: 'standard', include: [styleModule] };
        case 'string':
            // this is a standard style
            return { type: 'standard', id: style, include: [styleModule] };
        default:
            if (style.type === 'standard') {
                if (style.include) {
                    return { ...style, include: [...style.include, styleModule] };
                }
                return { ...style, include: [styleModule] };
            }
            throw cannotAddStyleModuleToCustomStyle(styleModule);
    }
};

/**
 * Checks if the source is missing and try to add it to the map by reloading its style.
 * @param map the TomTom map instance.
 * @param sourceId id of the source.
 * @param styleModule style module of the source.
 * @ignore
 */
export const ensureAddedToStyle = async (map: TomTomMap, sourceId: string, styleModule: StyleModule): Promise<void> => {
    if (!map.mapLibreMap.getSource(sourceId)) {
        const mapLibreMap = map.mapLibreMap;
        if (!mapLibreMap.isStyleLoaded()) {
            // we let the map settle before changing its style again, so the previous style/data load goes smoother:
            await mapLibreMap.once('idle');
        }
        map.setStyle(updateStyleWithModule(map.getStyle(), styleModule));
        await waitUntilSourceIsLoaded(map, sourceId);

        await mapLibreMap.once('styledata');
        // we're loading a bunch of style layers to the map, and we hide them all by default:
        // see TomTomMap.handleStyleData for similar logic
        for (const layer of filterLayersBySources(mapLibreMap, [sourceId])) {
            mapLibreMap.setLayoutProperty(layer.id, 'visibility', 'none', { validate: false });
        }
        // Since we just changed the style visibility, we ensure to wait until the style data is changed before returning to prevent race conditions:
        await mapLibreMap.once('styledata');
    }
};

/**
 * Sets the given image on the map (loading it if necessary), either adding or updating it.
 * @ignore
 */
export const addOrUpdateImage = async (
    mode: 'if-not-in-sprite' | 'add-or-update',
    imageId: string,
    imageToLoad: string | HTMLImageElement,
    map: Map,
    options?: Partial<StyleImageMetadata>,
) => {
    // defensive check (should not happen but we cannot let it crash):
    if (!imageToLoad) {
        console.warn(`addOrUpdateImage called with empty image for ID ${imageId}`);
        return;
    }

    // Helper function to add or update the image
    const addOrUpdateToMap = (imgElement: HTMLImageElement | ImageData | ImageBitmap) => {
        const imageExists = map.hasImage(imageId);
        if (imageExists && mode == 'add-or-update') {
            map.updateImage(imageId, imgElement);
        } else if (!imageExists) {
            map.addImage(imageId, imgElement, options);
        }
    };

    const ensureImageLoaded = (imgElement: HTMLImageElement) => {
        // An image is successfully loaded if it's complete AND has valid dimensions
        // (naturalWidth > 0 ensures the image didn't fail to load)
        if (imgElement.complete) {
            if (imgElement.naturalWidth > 0) {
                addOrUpdateToMap(imgElement);
            } else {
                // Image is complete but failed to load
                console.warn(`Failed to load image for ID ${imageId}`);
            }
        } else {
            imgElement.onload = () => addOrUpdateToMap(imgElement);
            imgElement.onerror = () => console.warn(`Failed to load image for ID ${imageId}`);
        }
    };

    if (typeof imageToLoad === 'string') {
        if (imageToLoad.includes('<svg')) {
            // Supporting raw SVGs:
            const imgElement = svgToImg(parseSvg(imageToLoad));
            ensureImageLoaded(imgElement);
        } else {
            // Expecting image URL, so the image needs to be downloaded first:
            addOrUpdateToMap((await map.loadImage(imageToLoad)).data);
        }
    } else {
        // Expecting HTMLImageElement, wait for it to be loaded
        ensureImageLoaded(imageToLoad);
    }
};

/**
 * Returns the light/dark theme for a known standard style.
 * @param standardStyleID
 */
const getStandardStyleTheme = (standardStyleID: StandardStyleID): LightDark => {
    switch (standardStyleID) {
        case 'standardDark':
        case 'drivingDark':
        case 'monoDark':
        case 'satellite':
            return 'dark';
        default:
            return 'light';
    }
};

/**
 * Returns the light/dark theme for a given style input.
 * * Unknown standard styles and custom styles are considered as 'light' theme.
 * @param styleInput The style input to check. If not provided, 'light' is returned.
 * @ignore
 */
export const getStyleLightDarkTheme = (styleInput?: StyleInput): LightDark => {
    if (typeof styleInput === 'string') {
        return getStandardStyleTheme(styleInput);
    }
    const standardStyle = styleInput as StandardStyle;
    if (standardStyle?.id) {
        return getStandardStyleTheme(standardStyle.id);
    }
    return 'light';
};

/**
 * Adds the large POI sprite to the map style.
 * @ignore
 */
export const addPinCategoriesSpriteToStyle = async (mapParams: InternalTomTomMapParams, mapLibreMap: Map) => {
    const params = new URLSearchParams();
    // Proxy deployments leave apiKey empty and let the proxy inject the real
    // key server-side. Skip the param entirely rather than emitting `key=`.
    if (mapParams.apiKey) {
        params.set('key', mapParams.apiKey);
    }
    params.set('poi', `poi_${getStyleLightDarkTheme(mapParams.style)}`);
    params.set('apiVersion', '1');
    params.set('apiChannel', 'preview');
    mapLibreMap.setSprite(`${mapParams.commonBaseURL}/maps/orbis/assets/sprites/2.*/sprite?${params}`, {
        validate: false,
    });
};
