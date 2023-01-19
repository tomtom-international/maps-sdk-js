import isNil from "lodash/isNil";
import { AbstractMapModule, EventsModule, POI_SOURCE_ID, StyleSourceWithLayers } from "../core";
import { buildIncludeIconArrayFilterExpression, buildExcludeIconArrayFilterExpression } from "./filterExpressions";
import {
    CategoriesFilter,
    FilteredPOICategories,
    POICategoriesFilterMode,
    VectorTilePOIsConfig
} from "./types/VectorTilePOIsConfig";
import { changingWhileNotInTheStyle } from "../core/ErrorMessages";
import { waitUntilMapIsReady } from "../utils/mapUtils";
import { GOSDKMap } from "../GOSDKMap";
import { POIClassification, poiClassificationToIconID } from "../places";
import { POIClassificationGroup, poiClassificationGroups } from "./poiClassificationGroups";

const getCategoryIcons = (categories: FilteredPOICategories): number[] => {
    const categoryIds: number[] = [];
    categories.forEach((category) => {
        if (category in poiClassificationGroups) {
            categoryIds.push(...poiClassificationGroups[category as POIClassificationGroup]);
        } else if (category in poiClassificationToIconID) {
            categoryIds.push(poiClassificationToIconID[category as POIClassification]);
        }
    });
    return categoryIds;
};

/**
 * Vector tile POIs map module.
 * * Refers to the POIs layer from the vector map.
 */
export class VectorTilePOIs extends AbstractMapModule<VectorTilePOIsConfig> {
    private poi?: StyleSourceWithLayers;
    private categoriesFilter?: CategoriesFilter;

    private constructor(goSDKMap: GOSDKMap, config?: VectorTilePOIsConfig) {
        super(goSDKMap, config);

        const poiRuntimeSource = this.mapLibreMap.getSource(POI_SOURCE_ID);
        if (poiRuntimeSource) {
            this.poi = new StyleSourceWithLayers(this.mapLibreMap, poiRuntimeSource);
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
            const { categories, mode } = this.categoriesFilter;
            const categoryIcons = getCategoryIcons(categories);
            const filterExpression =
                mode === "exclude"
                    ? buildExcludeIconArrayFilterExpression(categoryIcons)
                    : buildIncludeIconArrayFilterExpression(categoryIcons);

            this.mapLibreMap.setFilter("POI", filterExpression);
        }
    }

    setCategoriesFilterMode(mode: POICategoriesFilterMode): void {
        if (!isNil(this.categoriesFilter)) {
            this.categoriesFilter.mode = mode;
        } else {
            this.categoriesFilter = {
                mode,
                categories: []
            };
        }
        this.filterCategories();
    }

    addCategoriesFilter(categories: FilteredPOICategories): void {
        if (!isNil(this.categoriesFilter)) {
            categories.forEach(
                (category) =>
                    !this.categoriesFilter?.categories.includes(category) &&
                    this.categoriesFilter?.categories.push(category)
            );
        } else {
            this.categoriesFilter = {
                mode: "exclude",
                categories
            };
        }
        this.filterCategories();
    }

    removeCategoriesFilter(categories: FilteredPOICategories): void {
        if (!isNil(this.categoriesFilter)) {
            this.categoriesFilter.categories = this.categoriesFilter?.categories.filter(
                (category) => !categories.includes(category)
            );
            this.filterCategories();
        } else {
            console.warn("There are no filters applied");
        }
    }

    /**
     * Create the events on/off for this module
     * @returns An instance of EventsModule
     */
    get events() {
        return new EventsModule(this.goSDKMap._eventsProxy, this.poi);
    }
}
