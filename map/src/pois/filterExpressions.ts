import { FilterSpecification } from "maplibre-gl";
import { POICategoriesFilterMode } from "./types/VectorTilePOIsConfig";

/**
 * a function to create filter expression for a single of category, either to include or exclude them
 * @ignore
 */
// example for excluding iconID ["all", ["!=",  ["get", "icon"], 123]]
// example for including only specific iconID ["any", ["==",  ["get", "icon"], 123]]
export const buildIconFilterExpression = (icon: number, showMode: POICategoriesFilterMode): FilterSpecification => {
    return [showMode === "all_except" ? "!=" : "==", ["get", "icon"], icon] as FilterSpecification;
};

/**
 * a function to create filter expression for array of categories, either to include or exclude them
 * @ignore
 */
// example for excluding iconID ["all", ["!=",  ["get", "icon"], 123], ["!=",  ["get", "icon"], 456]]
// example for including only specific iconID ["any", ["==",  ["get", "icon"], 123], ["==",  ["get", "icon"], 456]]
export const buildIconArrayFilterExpression = (
    icons: number[],
    showMode: POICategoriesFilterMode
): FilterSpecification => {
    const expression: any = showMode === "all_except" ? ["all"] : ["any"];
    icons?.forEach((icon) => expression.push(buildIconFilterExpression(icon, showMode)));
    return expression;
};

/**
 * a function to combine categories filters with already applied filters to the layer
 * @ignore
 */
export const combineWithExistingFilter = (
    icons: number[],
    showMode: POICategoriesFilterMode,
    layerFilter?: FilterSpecification
): FilterSpecification => {
    const categoryFilter = buildIconArrayFilterExpression(icons, showMode);
    if (layerFilter) {
        return ["all", categoryFilter, layerFilter] as FilterSpecification;
    }
    return categoryFilter;
};
