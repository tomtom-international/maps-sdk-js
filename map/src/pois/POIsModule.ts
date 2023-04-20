import isNil from "lodash/isNil";
import { FilterSpecification } from "maplibre-gl";
import { AbstractMapModule, EventsModule, POI_SOURCE_ID, StyleSourceWithLayers, ValuesFilter } from "../shared";
import { FilterablePOICategory, POIsModuleConfig, POIsModuleFeature } from "./types/POIsModuleConfig";
import { notInTheStyle } from "../shared/ErrorMessages";
import { waitUntilMapIsReady } from "../shared/mapUtils";
import { TomTomMap } from "../TomTomMap";
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
type POIsSourcesAndLayers = {
    /**
     * Places of interest source id with corresponding layers ids.
     */
    poi: StyleSourceWithLayers;
};

/**
 * Vector tile POIs map module.
 * * Refers to the POIs layer from the vector map.
 */
export class POIsModule extends AbstractMapModule<POIsSourcesAndLayers, POIsModuleConfig> {
    private categoriesFilter?: ValuesFilter<FilterablePOICategory> | null;
    private originalFilter?: FilterSpecification;

    /**
     * Gets the POIs Module for the given TomTomMap and configuration once the map is ready.
     * @param tomtomMap The TomTomMap instance.
     * @param config  The module optional configuration
     * @returns {Promise} Returns a promise with a new instance of this module
     */
    static async get(tomtomMap: TomTomMap, config?: POIsModuleConfig): Promise<POIsModule> {
        await waitUntilMapIsReady(tomtomMap);
        return new POIsModule(tomtomMap, config);
    }

    private constructor(tomtomMap: TomTomMap, config?: POIsModuleConfig) {
        super(tomtomMap, config);
    }

    protected _initSourcesWithLayers() {
        const poiRuntimeSource = this.mapLibreMap.getSource(POI_SOURCE_ID);
        if (!poiRuntimeSource) {
            throw notInTheStyle(`init ${POIsModule.name} with source ID ${POI_SOURCE_ID}`);
        }
        const poi = new StyleSourceWithLayers(this.mapLibreMap, poiRuntimeSource);
        this.originalFilter = this.mapLibreMap.getFilter(poi.sourceAndLayerIDs.layerIDs[0]) as FilterSpecification;
        return { poi };
    }

    protected _applyConfig(config: POIsModuleConfig | undefined) {
        if (config && !isNil(config.visible)) {
            this.setVisible(config.visible);
        } else if (!this.isVisible()) {
            // applying default:
            this.setVisible(true);
        }

        this.filterCategories(config?.filters?.categories);
        return config;
    }

    isVisible(): boolean {
        return this.sourcesWithLayers.poi.isAnyLayerVisible();
    }

    setVisible(visible: boolean): void {
        this.sourcesWithLayers.poi.setAllLayersVisible(visible);
        this.config = {
            ...this.config,
            visible
        };
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
            this.config = {
                ...this.config,
                filters: {
                    categories: categoriesFilter
                }
            };
        } else if (this.categoriesFilter) {
            // reset categories config to default
            this.config = {
                ...this.config,
                filters: {
                    categories: {
                        show: "all_except",
                        values: []
                    }
                }
            };
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
        return new EventsModule<POIsModuleFeature>(this.tomtomMap._eventsProxy, this.sourcesWithLayers.poi);
    }
}
