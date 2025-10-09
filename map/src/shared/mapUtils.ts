import type { GlobalConfig } from '@cet/maps-sdk-js/core';
import { generateTomTomHeaders } from '@cet/maps-sdk-js/core';
import type {
    FilterSpecification,
    Map,
    MapGeoJSONFeature,
    RequestParameters,
    ResourceType,
    StyleImageMetadata,
} from 'maplibre-gl';
import { CustomStyle, StandardStyle, StandardStyleID, StyleInput, StyleModule, type TomTomMapParams } from '../init';
import type { TomTomMap } from '../TomTomMap';
import { cannotAddStyleModuleToCustomStyle } from './errorMessages';
import type { AbstractSourceWithLayers } from './SourceWithLayers';
import type { ToBeAddedLayerSpec, ToBeAddedLayerSpecWithoutSource } from './types';

/**
 * Wait until the map is ready
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
 * @ignore
 * @param features An Array with MapGeoJSONFeatures objects
 */
export const deserializeFeatures = (features: MapGeoJSONFeature[]): void => {
    for (const feature of features) {
        if (!feature || Object.keys(feature.properties).length === 0) {
            return;
        }

        for (const key in feature.properties) {
            if (typeof feature.properties[key] === 'string') {
                try {
                    feature.properties[key] = JSON.parse(feature.properties[key]);
                } catch (e) {
                    // We ignore the error if the object can't be parsed and continue.
                    console.warn('Cannot deserialize feature property', key, 'with value', feature.properties[key], e);
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
 * Compares two MapLibre features by reference or ID.
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
 * Check if the source is missing and try to add it to the map by reloading its style.
 * @param map the TomTom map instance.
 * @param ensureAddedToStyle
 * @param sourceId id of the source.
 * @param styleModule style module of the source.
 * @ignore
 */
export const prepareForModuleInit = async (
    map: TomTomMap,
    ensureAddedToStyle: boolean | undefined,
    sourceId: string,
    styleModule: StyleModule,
): Promise<void> => {
    await waitUntilMapIsReady(map);
    if (ensureAddedToStyle && !map.mapLibreMap.getSource(sourceId)) {
        if (!map.mapLibreMap.isStyleLoaded()) {
            // we let the map settle before changing its style again, so the previous style/data load goes smoother:
            await map.mapLibreMap.once('idle');
        }
        map.setStyle(updateStyleWithModule(map.getStyle(), styleModule));
        await waitUntilSourceIsLoaded(map, sourceId);
    }
};

/**
 * Adds the given image to the map (loading it if necessary) only if it's not already there.
 * @ignore
 */
export const addImageIfNotExisting = async (
    map: Map,
    imageId: string,
    imageToLoad: string | HTMLImageElement,
    options?: Partial<StyleImageMetadata>,
) => {
    if (!map.hasImage(imageId) && imageToLoad) {
        if (typeof imageToLoad === 'string') {
            // Expecting image URL, so the image needs to be downloaded first:
            const loadedImage = await map.loadImage(imageToLoad);
            // double-checking just in case of a race condition with overlapping call:
            if (!map.hasImage(imageId)) {
                map.addImage(imageId, loadedImage.data, options);
            }
        } else {
            // Expecting HTMLImageElement, ready to be added:
            // (Defensive setTimeout to ensure the image is loaded)
            setTimeout(() => map.addImage(imageId, imageToLoad, options));
        }
    }
};

export type LightDark = 'light' | 'dark';

/**
 * Returns the light/dark theme for a known standard style.
 * @param publishedStyleID
 */
const getPublishedStyleTheme = (publishedStyleID: StandardStyleID): LightDark => {
    switch (publishedStyleID) {
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
export const getStyleInputTheme = (styleInput?: StyleInput): LightDark => {
    if (typeof styleInput === 'string') {
        return getPublishedStyleTheme(styleInput);
    }
    const publishedStyle = styleInput as StandardStyle;
    if (publishedStyle?.id) {
        return getPublishedStyleTheme(publishedStyle.id);
    }
    return 'light';
};

/**
 * Adds the large POI sprite to the map style.
 * @param mapParams
 * @param mapLibreMap
 * @ignore
 */
export const addPinSpriteToStyle = async (mapParams: TomTomMapParams, mapLibreMap: Map) => {
    mapLibreMap.setSprite(
        `${mapParams.commonBaseURL}/maps/orbis/assets/sprites/2.*/sprite?key=${mapParams.apiKey}&poi=poi_${getStyleInputTheme(mapParams.style)}&apiVersion=1&apiChannel=preview`,
        { validate: false },
    );
};
