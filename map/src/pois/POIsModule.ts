import isNil from "lodash/isNil";
import { FilterSpecification } from "maplibre-gl";
import {
    AbstractMapModule,
    BASE_MAP_SOURCE_ID,
    EventsModule,
    POI_SOURCE_ID,
    StyleModuleInitConfig,
    StyleSourceWithLayers,
    ValuesFilter
} from "../shared";
import { FilterablePOICategory, POIsModuleConfig, POIsModuleFeature } from "./types/poisModuleConfig";
import { notInTheStyle } from "../shared/errorMessages";
import { prepareForModuleInit } from "../shared/mapUtils";
import { TomTomMap } from "../TomTomMap";
import { MapStylePOICategory, toMapDisplayPOICategory } from "../places";
import { poiCategoryGroups } from "./poiCategoryGroups";
import { buildMappedValuesFilter, getMergedAllFilter } from "../shared/mapLibreFilterUtils";

/**
 * Gets the specified filtered categories icon IDs to be used in map filtering.
 * @param categories list of filtered categories.
 * @ignore
 */
export const getStyleCategories = (categories: FilterablePOICategory[]): string[] => {
    const categoryIds: string[] = [];
    categories.forEach((category: FilterablePOICategory) => {
        if (category in poiCategoryGroups) {
            categoryIds.push(...poiCategoryGroups[category].map(toMapDisplayPOICategory));
        } else {
            categoryIds.push(toMapDisplayPOICategory(category as MapStylePOICategory));
        }
    });
    return [...new Set(categoryIds)];
};

/**
 * IDs of sources and layers for places of interest module.
 */
type POIsSourcesAndLayers = {
    /**
     * Places of interest with corresponding layer ids.
     * TODO: technically source ID is vectorTiles if POIs stay included in base map for Orbis
     */
    poi: StyleSourceWithLayers;
};

/**
 * Layer IDs for POIs on the map.
 */
export const poiLayerIDs = ["POI", "POI - Micro"];

/**
 * Vector tile POIs map module.
 * * Refers to the POIs layer from the vector map.
 */
export class POIsModule extends AbstractMapModule<POIsSourcesAndLayers, POIsModuleConfig> {
    private categoriesFilter?: ValuesFilter<FilterablePOICategory> | null;
    private originalFilter?: FilterSpecification;

    /**
     * Gets the POIs Module for the given TomTomMap and configuration once the map is ready.
     * @param map The TomTomMap instance.
     * @param config  The module optional configuration
     * @returns {Promise} Returns a promise with a new instance of this module
     */
    static async get(map: TomTomMap, config?: StyleModuleInitConfig & POIsModuleConfig): Promise<POIsModule> {
        // TODO: POIs are included in the Orbis base map for now:
        await prepareForModuleInit(map, config?.ensureAddedToStyle, POI_SOURCE_ID, "poi");
        return new POIsModule(map, config);
    }

    private constructor(map: TomTomMap, config?: POIsModuleConfig) {
        super(map, config);
    }

    /**
     * @ignore
     */
    protected _initSourcesWithLayers() {
        const poiRuntimeSource = this.mapLibreMap.getSource(BASE_MAP_SOURCE_ID);
        if (!poiRuntimeSource) {
            throw notInTheStyle(`init ${POIsModule.name} with source ID ${POI_SOURCE_ID}`);
        }
        const poi = new StyleSourceWithLayers(this.mapLibreMap, poiRuntimeSource, (layer) =>
            poiLayerIDs.includes(layer.id)
        );
        // TODO: verify that the specific POI layers are in the style
        this.originalFilter = this.mapLibreMap.getFilter(poi.sourceAndLayerIDs.layerIDs[0]) as FilterSpecification;
        return { poi };
    }

    /**
     * @ignore
     */
    protected _applyConfig(config: POIsModuleConfig | undefined) {
        if (config && !isNil(config.visible)) {
            this.setVisible(config.visible);
        } else if (!this._initializing && !this.isVisible()) {
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
        this.sourcesWithLayers.poi.setLayersVisible(visible);
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
                "category",
                categoriesFilter.show,
                getStyleCategories(categoriesFilter.values)
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
