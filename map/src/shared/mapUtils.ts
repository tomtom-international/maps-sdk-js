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
import { StandardStyle, StandardStyleID, StyleInput, StyleModule, type TomTomMapParams } from '../init';
import type { TomTomMap } from '../TomTomMap';
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

/**
 * Deserializes the properties from MapLibre features.
 * * Maplibre has a bug where all properties from a feature are stringified.
 * See: {@link} https://github.com/maplibre/maplibre-gl-js/issues/1325
 *
 * @param features An Array with MapGeoJSONFeatures objects
 *
 * @ignore
 */
export const deserializeFeatures = (features: MapGeoJSONFeature[]): void => {
    for (const feature of features) {
        if (!feature || !Object.keys(feature.properties).length) {
            continue;
        }

        for (const key in feature.properties) {
            if (typeof feature.properties[key] === 'string') {
                try {
                    feature.properties[key] = JSON.parse(feature.properties[key]);
                } catch (_e) {
                    // We ignore the error if the object can't be parsed and continue.
                    // console.debug('Cannot deserialize feature property', key, 'with value', feature.properties[key], e);
                }
            }
        }
    }
};

/**
 * Inject TomTom custom headers to requests to TomTom.
 *
 * @ignore
 * @param params Global SDK Map configuration
 */
export const injectTomTomHeaders =
    (params: Partial<GlobalConfig>) =>
    (url: string, resourceType?: ResourceType): RequestParameters => {
        if (url.includes('tomtom.com')) {
            if (resourceType === 'Image') {
                return { url };
            }
            return { url, headers: { ...generateTomTomHeaders(params) } };
        }
        return { url };
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
        if (idsWeCanProcess.length === 0) {
            throw Error(`Circular dependency for before Ids ${JSON.stringify(Object.keys(mapIdDependency))}`);
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
export const addPinCategoriesSpriteToStyle = async (mapParams: TomTomMapParams, mapLibreMap: Map) => {
    mapLibreMap.setSprite(
        `${mapParams.commonBaseURL}/maps/orbis/assets/sprites/2.*/sprite?key=${mapParams.apiKey}&poi=poi_${getStyleLightDarkTheme(mapParams.style)}&apiVersion=1&apiChannel=preview`,
        { validate: false },
    );
};
