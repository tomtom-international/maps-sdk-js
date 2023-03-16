import isNil from "lodash/isNil";
import { FilterSpecification } from "maplibre-gl";
import {
    AbstractMapModule,
    EventsModule,
    POI_SOURCE_ID,
    SourceAndLayerIDs,
    StyleSourceWithLayers,
    ValuesFilter
} from "../shared";
import { FilterablePOICategory, VectorTilePOIsFeature, VectorTilePOIsConfig } from "./types/VectorTilePOIsConfig";
import { notInTheStyle } from "../shared/ErrorMessages";
import { waitUntilMapIsReady } from "../shared/mapUtils";
import { GOSDKMap } from "../GOSDKMap";
import { MapStylePOIClassification, poiClassificationToIconID } from "../places";
import { POIClassificationGroup, poiClassificationGroups } from "./poiClassificationGroups";
import { buildMappedValuesFilter, getMergedAllFilter } from "../shared/MapLibreFilterUtils";

/**
 * Gets the specified filtered categories icon IDs to be used in map filtering.
 * @param categories list of filtered categories.
 */
export const getCategoryIcons = (categories: FilterablePOICategory[]): number[] => {
    const categoryIds: number[] = [];
    categories.forEach((category) => {
        if (category in poiClassificationGroups) {
            categoryIds.push(...poiClassificationGroups[category as POIClassificationGroup]);
        } else if (category in poiClassificationToIconID) {
            categoryIds.push(poiClassificationToIconID[category as MapStylePOIClassification]);
        }
    });
    return [...new Set(categoryIds)];
};

/**
 * IDs of sources and layers for places of interest module.
 */
export type POIsModuleSourcesAndLayersIds = {
    /**
     * Places of interest source id with corresponding layers ids.
     */
    poisIDs: SourceAndLayerIDs;
};

/**
 * Vector tile POIs map module.
 * * Refers to the POIs layer from the vector map.
 */
export class VectorTilePOIs extends AbstractMapModule<POIsModuleSourcesAndLayersIds, VectorTilePOIsConfig> {
    private poi!: StyleSourceWithLayers;
    private categoriesFilter?: ValuesFilter<FilterablePOICategory> | null;
    private originalFilter?: FilterSpecification;

    /**
     * Make sure the map is ready before create an instance of the module and any other interaction with the map
     * @param goSDKMap The GOSDKMap instance.
     * @param config  The module optional configuration
     * @returns {Promise} Returns a promise with a new instance of this module
     */
    static async init(goSDKMap: GOSDKMap, config?: VectorTilePOIsConfig): Promise<VectorTilePOIs> {
        await waitUntilMapIsReady(goSDKMap);
        return new VectorTilePOIs(goSDKMap, config);
    }

    protected initSourcesWithLayers() {
        const poiRuntimeSource = this.mapLibreMap.getSource(POI_SOURCE_ID);
        if (!poiRuntimeSource) {
            throw notInTheStyle(`init ${VectorTilePOIs.name} with source ID ${POI_SOURCE_ID}`);
        }
        this.poi = new StyleSourceWithLayers(this.mapLibreMap, poiRuntimeSource);
        this.originalFilter = this.mapLibreMap.getFilter(this.poi.layerSpecs[0]?.id) as FilterSpecification;
        this._addModuleToEventsProxy(true);
        return { poisIDs: { sourceID: POI_SOURCE_ID, layerIDs: this.poi.layerSpecs.map((layerSpec) => layerSpec.id) } };
    }

    protected _applyConfig(config: VectorTilePOIsConfig | undefined): void {
        if (config && !isNil(config.visible)) {
            this.setVisible(config.visible);
        } else if (!this.isVisible()) {
            // applying default:
            this.setVisible(true);
        }

        this.filterCategories(config?.filters?.categories);

        if (config && !isNil(config.interactive)) {
            this._addModuleToEventsProxy(config.interactive);
        }
    }

    private _addModuleToEventsProxy(interactive: boolean) {
        this.goSDKMap._eventsProxy.ensureAdded(this.poi, interactive);
    }

    isVisible(): boolean {
        return this.poi.isAnyLayerVisible();
    }

    setVisible(visible: boolean): void {
        this.poi.setAllLayersVisible(visible);
    }

    /**
     * Applies the given categories filter to the POI layer (showing/hiding certain categories).
     * * Other configurations (such as visibility) remain untouched.
     * @param categoriesFilter The filter to apply. If undefined, the default will be applied.
     */
    filterCategories(categoriesFilter?: ValuesFilter<FilterablePOICategory> | undefined): void {
        if (categoriesFilter) {
            const poiFilter = buildMappedValuesFilter(
                "icon",
                categoriesFilter.show,
                getCategoryIcons(categoriesFilter.values)
            );
            this.mapLibreMap.setFilter("POI", getMergedAllFilter(poiFilter, this.originalFilter));
        } else if (this.categoriesFilter) {
            // Applies default:
            this.mapLibreMap.setFilter("POI", this.originalFilter);
        }

        this.categoriesFilter = categoriesFilter;
    }

    /**
     * Create the events on/off for this module
     * @returns An instance of EventsModule
     */
    get events() {
        return new EventsModule<VectorTilePOIsFeature>(this.goSDKMap._eventsProxy, this.poi);
    }
}
