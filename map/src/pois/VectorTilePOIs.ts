import isNil from "lodash/isNil";
import { FilterSpecification } from "maplibre-gl";
import { AbstractMapModule, EventsModule, POI_SOURCE_ID, StyleSourceWithLayers } from "../core";
import { combineWithExistingFilter } from "./filterExpressions";
import { CategoriesFilter, FilteredPOICategories, VectorTilePOIsConfig } from "./types/VectorTilePOIsConfig";
import { changingWhileNotInTheStyle } from "../core/ErrorMessages";
import { waitUntilMapIsReady } from "../utils/mapUtils";
import { GOSDKMap } from "../GOSDKMap";
import { POIClassification, poiClassificationToIconID } from "../places";
import { POIClassificationGroup, poiClassificationGroups } from "./poiClassificationGroups";

/**
 * Gets the specified filtered categories icon IDs to be used in map filtering.
 * @param categories list of filtered categories.
 * @group MapPOIs
 * @category Functions
 */
export const getCategoryIcons = (categories: FilteredPOICategories): number[] => {
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
    private readonly poi?: StyleSourceWithLayers;
    private categoriesFilter?: CategoriesFilter;
    private readonly layerFilter?: FilterSpecification;

    private constructor(goSDKMap: GOSDKMap, config?: VectorTilePOIsConfig) {
        super(goSDKMap, config);

        const poiRuntimeSource = this.mapLibreMap.getSource(POI_SOURCE_ID);
        if (poiRuntimeSource) {
            this.poi = new StyleSourceWithLayers(this.mapLibreMap, poiRuntimeSource);
            const existingFilter = this.mapLibreMap.getFilter(this.poi.layerSpecs[0]?.id);
            if (existingFilter) {
                this.layerFilter = existingFilter;
            }
        }

        if (config) {
            this.applyConfig(config);

            if (config.interactive && this.poi) {
                goSDKMap._eventsProxy.add(this.poi);
            }
        }
    }

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

    applyConfig(config: VectorTilePOIsConfig): void {
        if (!isNil(config.visible)) {
            this.setVisible(config.visible);
        }
        if (!isNil(config.categoriesFilter)) {
            this.categoriesFilter = config.categoriesFilter;
            this.filterCategories();
        }
    }

    isVisible(): boolean {
        return !!this.poi?.isAnyLayerVisible();
    }

    setVisible(visible: boolean): void {
        if (this.poi) {
            this.poi.setAllLayersVisible(visible);
        } else {
            console.error(changingWhileNotInTheStyle("POIs visibility"));
        }
    }

    toggleVisibility(): void {
        this.setVisible(!this.isVisible());
    }

    private filterCategories(): void {
        if (this.categoriesFilter) {
            const { categories, show } = this.categoriesFilter;
            const categoryIcons = getCategoryIcons(categories);
            const filterExpression = combineWithExistingFilter(categoryIcons, show, this.layerFilter);
            this.mapLibreMap.setFilter("POI", filterExpression);
        }
    }

    setCategoriesFilterAndApply(categoriesFilter: CategoriesFilter): void {
        this.categoriesFilter = categoriesFilter;
        this.filterCategories();
    }

    /**
     * Create the events on/off for this module
     * @returns An instance of EventsModule
     */
    get events() {
        return new EventsModule(this.goSDKMap._eventsProxy, this.poi);
    }
}
