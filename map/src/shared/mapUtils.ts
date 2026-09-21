import type { GlobalConfig } from '@tomtom-org/maps-sdk/core';
import { DEFAULT_COMMON_BASE_URL, generateTomTomHeaders, isProxyCredentialsMode } from '@tomtom-org/maps-sdk/core';
import type {
    AllLayoutProperties,
    AllPaintProperties,
    BackgroundLayerSpecification,
    FilterSpecification,
    Map,
    MapGeoJSONFeature,
    RequestParameters,
    ResourceType,
    StyleImageMetadata,
    StyleSpecification,
} from 'maplibre-gl';
import { CustomStyle, InternalTomTomMapParams, StandardStyle, StandardStyleID, StyleInput, StyleModule } from '../init';
import type { TomTomMap } from '../TomTomMap';
import { FLOW_TAGS } from '../traffic/util/trafficFlowMapping';
import { INCIDENT_TAGS } from '../traffic/util/trafficIncidentMapping';
import { relativeLuminance } from '../utils/colorUtils';
import { cannotAddStyleModuleToCustomStyle } from './errorMessages';
import { PIN_CATEGORIES_SPRITE_ID, svgToImg } from './imageUtils';
import { parseSvg } from './resources';
import { AbstractSourceWithLayers } from './SourceWithLayers';
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

const isTomTomHostname = (hostname: string): boolean =>
    hostname === 'api.tomtom.com' || hostname.endsWith('.api.tomtom.com');

/**
 * Vector tiles are served from prefixed-subdomain CDN hosts
 * (a./b./c./d.api.tomtom.com) for browser-parallelism. Rewrite all of those
 * plus the bare `api.tomtom.com` host to the proxy. With credentials-proxy
 * mode drop any inbound `key` param too: TomTom's edge bakes the request's key
 * into tile URLs returned in the style JSON, and the proxy injects its own
 * server-side — leaving the client-visible key would just leak it.
 *
 * Returns the original URL unchanged when it isn't a TomTom host or when
 * we're not in proxy mode.
 */
const rewriteForProxy = (url: string, baseURL: string, isProxyMode: boolean, isCredentialsProxy: boolean): string => {
    if (!isProxyMode) return url;
    try {
        const parsed = new URL(url);
        if (!isTomTomHostname(parsed.hostname)) return url;
        if (isCredentialsProxy) {
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
     * Installed by the demos-proxy session bootstrap both example builds inject
     * (`examples/src/demos-proxy/demosProxyBootstrap.ts`). Resolves once the
     * session cookie is valid and not about to expire, re-minting it first when
     * needed. A global var rather than a Window member so it can be read off
     * `globalThis`.
     */
    var __DEMOS_PROXY_ENSURE_SESSION__: (() => Promise<void>) | undefined;
}

/**
 * Gate a request on a fresh demos-proxy session when the bootstrap installed its
 * hook. MapLibre awaits transformRequest results on the MAIN thread before
 * handing a request to its tile worker, which makes this the one place that can
 * hold back worker-fetched tiles until the session cookie is renewed (the
 * workers' own `fetch` is unreachable from here). Without the hook this stays
 * fully synchronous, and a failed renewal lets the request proceed (it will
 * 401, same as without the gate) rather than wedging the map.
 * @ignore
 */
const gateOnDemosProxySession = (result: RequestParameters): RequestParameters | Promise<RequestParameters> => {
    const ensureSession = globalThis.__DEMOS_PROXY_ENSURE_SESSION__;
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
 * the configured base URL, and — with a credentials proxy — set
 * `credentials: 'include'` so the session cookie travels with each tile.
 *
 * @ignore
 * @param params Global SDK Map configuration
 */
export const transformRequest = (params: Partial<GlobalConfig>) => {
    const baseURL = params.commonBaseURL ?? DEFAULT_COMMON_BASE_URL;
    // commonBaseURL points at something other than TomTom — the demos proxy or a
    // customer's own customServiceBaseURL. We always rewrite tile hostnames to
    // flow through it.
    const isProxyMode = baseURL !== DEFAULT_COMMON_BASE_URL;
    // Credentials proxy: it injects the key server-side (no apiKey), so we strip
    // key= and attach `credentials: 'include'`. customServiceBaseURL keeps its
    // apiKey and is excluded (its backend may serve CORS as `*`).
    const isCredentialsProxy = isProxyCredentialsMode(params);

    return (url: string, resourceType?: ResourceType): RequestParameters | Promise<RequestParameters> => {
        const rewrittenUrl = rewriteForProxy(url, baseURL, isProxyMode, isCredentialsProxy);
        const isProxyUrl = isProxyMode && rewrittenUrl.startsWith(baseURL);
        const useCredentials = isCredentialsProxy && isProxyUrl;

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
                ? gateOnDemosProxySession({ url: rewrittenUrl, credentials: 'include' })
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
            return gateOnDemosProxySession(result);
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

// Style-spec property names and name/value pairs, as `changeLayerProps` needs them to call
// maplibre's key-generic setters.
type LayoutKey = keyof AllLayoutProperties;
type PaintKey = keyof AllPaintProperties;
type LayoutEntry = [LayoutKey, AllLayoutProperties[LayoutKey]];
type PaintEntry = [PaintKey, AllPaintProperties[PaintKey]];

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
    // maplibre v6 keys both setters by property name, while the specs we diff here are
    // string-keyed (`layout`/`paint` are `any`). Narrow once per loop rather than at every call:
    // `Object.keys`/`Object.entries` can only ever report `string`, so the correspondence to the
    // style-spec keys is ours to assert either way — doing it in the loop header keeps the
    // setter calls readable and asserts each fact once.
    for (const property of Object.keys(prevLayerProps.layout ?? {}) as LayoutKey[]) {
        if (!newLayerProps.layout?.[property]) {
            map.setLayoutProperty(layerId, property, undefined, { validate: false });
        }
    }
    for (const property of Object.keys(prevLayerProps.paint ?? {}) as PaintKey[]) {
        if (!newLayerProps.paint?.[property]) {
            map.setPaintProperty(layerId, property, undefined, { validate: false });
        }
    }
    for (const [property, value] of Object.entries(newLayerProps.paint ?? {}) as PaintEntry[]) {
        map.setPaintProperty(layerId, property, value, { validate: false });
    }

    for (const [property, value] of Object.entries(newLayerProps.layout ?? {}) as LayoutEntry[]) {
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
 * Moves every layer whose spec now names a different anchor, and every layer pinned to one that
 * moved, so a group of layers drawn as one keeps its internal order wherever it lands.
 *
 * @remarks
 * Where a layer draws is neither paint nor layout, so {@link changeLayersProps} cannot say it —
 * only `moveLayer` can. Moving the anchored layer alone is not enough either: MapLibre holds no
 * relation between two layers, so a sibling pinned to the one that moved stays behind and the
 * group tears apart. A section drawn with a coloured line under a dashed one is exactly that case.
 * @ignore
 */
const restackMovedLayers = (
    newLayerSpecs: ToBeAddedLayerSpecWithoutSource[],
    oldLayerSpecs: ToBeAddedLayerSpecWithoutSource[],
    recordedSpecs: ToBeAddedLayerSpec[],
    map: Map,
): void => {
    const movedLayerIDs = new Set<string>();
    const restack = (layerSpec: ToBeAddedLayerSpecWithoutSource): void => {
        if (!map.getLayer(layerSpec.id)) return;

        moveLayerBefore(map, layerSpec.id, layerSpec.beforeID);
        movedLayerIDs.add(layerSpec.id);
        // The recorded spec is what a style change replays, so it has to name the new anchor too.
        const recordedSpec = recordedSpecs.find((spec) => spec.id === layerSpec.id);
        if (recordedSpec) recordedSpec.beforeID = layerSpec.beforeID;
    };

    newLayerSpecs.forEach((newLayerSpec, index) => {
        if (newLayerSpec.beforeID !== oldLayerSpecs[index].beforeID) restack(newLayerSpec);
    });

    // Followers resolve in as many passes as the chain is long, and a layer already moved is never
    // picked again, so a circular pinning cannot spin here.
    const followers = () =>
        newLayerSpecs.filter(
            (spec) => !movedLayerIDs.has(spec.id) && spec.beforeID !== undefined && movedLayerIDs.has(spec.beforeID),
        );
    for (let pinned = followers(); pinned.length; pinned = followers()) {
        pinned.forEach(restack);
    }
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
    const addedLayerSpecs = layersToAdd.map(
        (layerId) =>
            ({
                ...newLayersMap[layerId],
                source: sourceWithLayers.source.id,
            }) as ToBeAddedLayerSpec,
    );
    if (addedLayerSpecs.length) {
        layerSpecs.push(...addedLayerSpecs);
        // A layer the new config introduced is not on the map yet — recording the spec does not put
        // it there. `addLayers` honours each spec's `beforeID` and adds it hidden; the caller
        // reveals it alongside the layers that were already there.
        addLayers(addedLayerSpecs, map);
    }
    sourceWithLayers._updateSourceAndLayerIDs();
    restackMovedLayers(newLayersToUpdate, oldLayersToUpdate, layerSpecs, map);
    // update existing layers
    changeLayersProps(newLayersToUpdate, oldLayersToUpdate, map);
};

/**
 * Returns `beforeLayerID` when the current style has that layer, and undefined — the top of the
 * layer stack — when it does not.
 *
 * MapLibre refuses both `addLayer` and `moveLayer` against a layer the style does not have: it
 * fires an `ErrorEvent` and gives up, so the layer is either never added or left where it was. Not
 * every anchor in the map style layer IDs exists in every style — the satellite style has neither
 * `lowestRoadLine` nor `lowestBuilding` — so a module positioning itself against one has to check
 * first. The top of the stack is the documented fallback for a missing reference layer.
 *
 * @ignore
 * @param map MapLibre map
 * @param beforeLayerID The wanted anchor layer, if any.
 */
export const existingBeforeLayerID = (map: Map, beforeLayerID: string | undefined): string | undefined =>
    beforeLayerID && map.getLayer(beforeLayerID) ? beforeLayerID : undefined;

/**
 * Moves a layer below `beforeLayerID`, or to the top of the stack when the style does not have
 * that layer. See {@link existingBeforeLayerID}.
 *
 * @ignore
 * @param map MapLibre map
 * @param layerID The layer to move.
 * @param beforeLayerID The layer to move it below, or undefined for the top of the stack.
 */
export const moveLayerBefore = (map: Map, layerID: string, beforeLayerID: string | undefined): void => {
    map.moveLayer(layerID, existingBeforeLayerID(map, beforeLayerID));
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
        // Resolves once the new style has loaded and the map has hidden the freshly added part's
        // layers (see TomTomMap.handleStyleData) — the module then shows them if asked to.
        await map.setStyle(updateStyleWithModule(map.getStyle(), styleModule));
        await waitUntilSourceIsLoaded(map, sourceId);
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
            try {
                addOrUpdateToMap((await map.loadImage(imageToLoad)).data);
            } catch (error) {
                console.warn(`Failed to load image for ID ${imageId}`, error);
            }
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
 * * A custom style that declares its `lightDarkTheme` is taken at its word.
 * * Unknown standard styles, and custom styles that declare nothing, are considered as 'light'
 *   theme. For the latter, {@link detectStyleLightDarkTheme} gives a better answer once the style
 *   has loaded.
 * @param styleInput The style input to check. If not provided, 'light' is returned.
 * @ignore
 */
export const getStyleLightDarkTheme = (styleInput?: StyleInput): LightDark => {
    if (typeof styleInput === 'string') {
        return getStandardStyleTheme(styleInput);
    }
    const declaredTheme = getDeclaredLightDarkTheme(styleInput);
    if (declaredTheme) {
        return declaredTheme;
    }
    const standardStyle = styleInput as StandardStyle;
    if (standardStyle?.id) {
        return getStandardStyleTheme(standardStyle.id);
    }
    return 'light';
};

/**
 * The light/dark theme a custom style declares for itself, or `undefined` when it declares none —
 * which is also every standard style, whose theme follows from its ID.
 * @ignore
 */
export const getDeclaredLightDarkTheme = (styleInput?: StyleInput): LightDark | undefined =>
    isCustomStyle(styleInput) ? (styleInput as CustomStyle).lightDarkTheme : undefined;

/**
 * Whether the style input names a custom style (URL or inline JSON) rather than a standard one.
 * @ignore
 */
export const isCustomStyle = (styleInput?: StyleInput): boolean =>
    typeof styleInput === 'object' && styleInput?.type === 'custom';

// Below this relative luminance (0 = black, 1 = white) a canvas colour reads as a dark map.
const DARK_LUMINANCE_THRESHOLD = 0.35;

// The first colour literal reachable in a paint value: the value itself when it is a plain colour,
// otherwise the first string inside the expression that parses as a colour. Good enough to tell a
// dark canvas from a light one; a background colour is very rarely data-driven.
const firstColorLiteral = (value: unknown): string | undefined => {
    if (typeof value === 'string') {
        return relativeLuminance(value) === undefined ? undefined : value;
    }
    if (Array.isArray(value)) {
        for (const item of value) {
            const found = firstColorLiteral(item);
            if (found) return found;
        }
    }
    return undefined;
};

/**
 * Reads the light/dark theme off a loaded style, from the colour its `background` layer paints the
 * canvas with. Returns `undefined` when the style has no background layer or its colour cannot be
 * read, so the caller can keep whatever it assumed before.
 * @ignore
 */
export const detectStyleLightDarkTheme = (
    style: Pick<StyleSpecification, 'layers'> | undefined,
): LightDark | undefined => {
    const background = style?.layers?.find((layer) => layer?.type === 'background');
    if (!background) return undefined;

    const color = firstColorLiteral((background as BackgroundLayerSpecification).paint?.['background-color']);
    const luminance = color === undefined ? undefined : relativeLuminance(color);
    if (luminance === undefined) return undefined;
    return luminance < DARK_LUMINANCE_THRESHOLD ? 'dark' : 'light';
};

/**
 * Adds the large POI sprite to the map style, as a sprite of its own.
 * * It has to be *added*, not set: the style already ships a `default` sprite with the base map
 *   icons (POIs, road shields, traffic), and setting the style's sprite replaces that one, which
 *   makes MapLibre drop every image it brought in.
 * * Called on every style load, so it skips the sprite once the current style has it.
 * @ignore
 */
export const addPinCategoriesSpriteToStyle = async (
    mapParams: InternalTomTomMapParams,
    theme: LightDark,
    mapLibreMap: Map,
) => {
    if (mapLibreMap.getSprite().some((sprite) => sprite.id === PIN_CATEGORIES_SPRITE_ID)) {
        return;
    }
    const params = new URLSearchParams();
    // Proxy deployments leave apiKey empty and let the proxy inject the real
    // key server-side. Skip the param entirely rather than emitting `key=`.
    if (mapParams.apiKey) {
        params.set('key', mapParams.apiKey);
    }
    params.set('poi', `poi_${theme}`);
    params.set('apiVersion', '1');
    params.set('apiChannel', 'preview');
    mapLibreMap.addSprite(
        PIN_CATEGORIES_SPRITE_ID,
        `${mapParams.commonBaseURL}/maps/orbis/assets/sprites/2.*/sprite?${params}`,
        { validate: false },
    );
};
