import { FilterSpecification, Map, MapGeoJSONFeature, RequestParameters, ResourceType } from "maplibre-gl";
import { generateTomTomCustomHeaders, GlobalConfig } from "@anw/maps-sdk-js/core";
import { TomTomMap } from "../TomTomMap";
import { ToBeAddedLayerSpec, ToBeAddedLayerSpecWithoutSource } from "./types";
import { AbstractSourceWithLayers } from "./SourceWithLayers";
import { StyleInput, StyleModule } from "../init";
import { cannotAddStyleModuleToCustomStyle } from "./errorMessages";

/**
 * Wait until the map is ready
 * @param tomtomMap The TomTomMap instance.
 * @returns {Promise<boolean>} Returns a Promise<boolean>
 */
export const waitUntilMapIsReady = async (tomtomMap: TomTomMap): Promise<void> => {
    if (!tomtomMap.mapReady) {
        await tomtomMap.mapLibreMap.once("styledata");
        // Recursively waiting for map to be ready (in case of style changes quickly in succession):
        await waitUntilMapIsReady(tomtomMap);
    }
};

export const waitUntilMapIsLoaded = async (tomtomMap: TomTomMap): Promise<void> => {
    if (!tomtomMap.mapReady || !tomtomMap.mapLibreMap.isStyleLoaded()) {
        await tomtomMap.mapLibreMap.once("load");
        // Recursively waiting for map to be ready (in case of style changes quickly in succession):
        await waitUntilMapIsLoaded(tomtomMap);
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
        await tomtomMap.mapLibreMap.once("sourcedata");
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
 * @param params Global SDK Map configuration
 */
export const injectCustomHeaders =
    (params: Partial<GlobalConfig>) =>
    (url: string, resourceType?: ResourceType): RequestParameters => {
        if (url.includes("tomtom.com")) {
            if (resourceType === "Image") {
                return { url };
            }
            return { url, headers: { ...generateTomTomCustomHeaders(params) } };
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
    const layerID = newLayerProps.id;
    if (newLayerProps.maxzoom !== prevLayerProps.maxzoom || newLayerProps.minzoom !== prevLayerProps.minzoom) {
        map.setLayerZoomRange(
            layerID,
            newLayerProps.minzoom ? newLayerProps.minzoom : map.getMinZoom(),
            newLayerProps.maxzoom ? newLayerProps.maxzoom : map.getMaxZoom()
        );
    }
    map.setFilter(layerID, newLayerProps.filter, { validate: false });
    for (const property of Object.keys(prevLayerProps.layout || [])) {
        if (!newLayerProps.layout?.[property]) {
            map.setLayoutProperty(layerID, property, undefined, { validate: false });
        }
    }
    for (const property of Object.keys(prevLayerProps.paint || [])) {
        if (!newLayerProps.paint?.[property]) {
            map.setPaintProperty(layerID, property, undefined, { validate: false });
        }
    }
    for (const [property, value] of Object.entries(newLayerProps.paint || [])) {
        map.setPaintProperty(layerID, property, value, { validate: false });
    }

    for (const [property, value] of Object.entries(newLayerProps.layout || [])) {
        map.setLayoutProperty(layerID, property, value, { validate: false });
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
    map: Map
): void => {
    // map layers by id in object for easier access, reduces number of loops
    const newLayersMap: Record<string, ToBeAddedLayerSpecWithoutSource> = newLayersSpecs.reduce(
        (acc, cur) => ({ ...acc, [cur.id]: cur }),
        {}
    );
    const oldLayersMap: Record<string, ToBeAddedLayerSpecWithoutSource> = oldLayersSpecs.reduce(
        (acc, cur) => ({ ...acc, [cur.id]: cur }),
        {}
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
            source: sourceWithLayers.source.id
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
            map.addLayer({ ...layer, layout: { ...layer.layout, visibility: "none" } }, layer.beforeID);
        }
        layerIdsAlreadyOnMap.add(layer.id);
    };

    const mapIdDependency: Record<string, ToBeAddedLayerSpec[]> = {};

    layersToAdd.forEach((layer) => {
        if (layer.beforeID) {
            if (layerIdsAlreadyOnMap.has(layer.beforeID) || map.getLayer(layer.beforeID)) {
                layerIdsAlreadyOnMap.add(layer.beforeID);
                addLayer(layer);
            } else {
                // we cannot add this layer yet
                if (mapIdDependency[layer.beforeID]) {
                    mapIdDependency[layer.beforeID].push(layer);
                } else {
                    mapIdDependency[layer.beforeID] = [layer];
                }
            }
        } else {
            addLayer(layer);
        }
    });

    // try to process rest of layers
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
 * Adding style module to the style, if possible.
 * @param style which we want to update.
 * @param styleModule module we want to add.
 * @ignore
 */
export const updateStyleWithModule = (style: StyleInput | undefined, styleModule: StyleModule): StyleInput => {
    switch (typeof style) {
        case "undefined":
            return { type: "published", include: [styleModule] };
        case "string":
            // this is a published style
            return { type: "published", id: style, include: [styleModule] };
        default:
            if (style.type === "published") {
                if (style.include) {
                    return { ...style, include: [...style.include, styleModule] };
                } else {
                    return { ...style, include: [styleModule] };
                }
            } else {
                throw cannotAddStyleModuleToCustomStyle(styleModule);
            }
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
    styleModule: StyleModule
): Promise<void> => {
    await waitUntilMapIsReady(map);
    if (ensureAddedToStyle && !map.mapLibreMap.getSource(sourceId)) {
        if (!map.mapLibreMap.isStyleLoaded()) {
            // we let the map settle before changing its style again, so the previous style/data load goes smoother:
            await map.mapLibreMap.once("idle");
        }
        map.setStyle(updateStyleWithModule(map.getStyle(), styleModule));
        await waitUntilSourceIsLoaded(map, sourceId);
    }
};
