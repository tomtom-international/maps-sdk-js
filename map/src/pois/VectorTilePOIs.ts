import isNil from "lodash/isNil";
import { FilterSpecification } from "maplibre-gl";
import { AbstractMapModule, EventsModule, POI_SOURCE_ID, StyleSourceWithLayers, ValuesFilter } from "../core";
import { FilterablePOICategory, VectorTilePOIsConfig } from "./types/VectorTilePOIsConfig";
import { notInTheStyle } from "../core/ErrorMessages";
import { waitUntilMapIsReady } from "../utils/mapUtils";
import { GOSDKMap } from "../GOSDKMap";
import { POIClassification, poiClassificationToIconID } from "../places";
import { POIClassificationGroup, poiClassificationGroups } from "./poiClassificationGroups";
import { buildMappedValuesFilter, getMergedAllFilter } from "../core/MapLibreUtils";

/**
 * Gets the specified filtered categories icon IDs to be used in map filtering.
 * @param categories list of filtered categories.
 * @group MapPOIs
 * @category Functions
 */
export const getCategoryIcons = (categories: FilterablePOICategory[]): number[] => {
    const categoryIds: number[] = [];
    categories.forEach((category) => {
        if (category in poiClassificationGroups) {
            categoryIds.push(...poiClassificationGroups[category as POIClassificationGroup]);
        } else if (category in poiClassificationToIconID) {
            categoryIds.push(poiClassificationToIconID[category as POIClassification]);
        }
    });
    return [...new Set(categoryIds)];
};

/**
 * Vector tile POIs map module.
 * * Refers to the POIs layer from the vector map.
 * @group MapPOIs
 * @category Functions
 */
export class VectorTilePOIs extends AbstractMapModule<VectorTilePOIsConfig> {
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
    }

    protected _applyConfig(config: VectorTilePOIsConfig | undefined): void {
        if (config && !isNil(config.visible)) {
            this.setVisible(config.visible);
        } else if (!this.isVisible()) {
            // applying default:
            this.setVisible(true);
        }

        this.filterCategories(config?.filters?.categories);

        if (config?.interactive) {
            this.goSDKMap._eventsProxy.ensureAdded(this.poi);
        }
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
        return new EventsModule(this.goSDKMap._eventsProxy, this.poi);
    }
}
