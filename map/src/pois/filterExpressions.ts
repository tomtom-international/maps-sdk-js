import { FilterSpecification } from "maplibre-gl";
import { POICategoriesFilterMode } from "./types/VectorTilePOIsConfig";

// example for excluding iconID ["all", ["!=",  ["get", "icon"], 123]]
// example for including only specific iconID ["any", ["==",  ["get", "icon"], 123]]
export const buildIconFilterExpression = (icon: number, mode: POICategoriesFilterMode): FilterSpecification => {
    return [mode === "exclude" ? "!=" : "==", ["get", "icon"], icon] as FilterSpecification;
};

// example for excluding iconID ["all", ["!=",  ["get", "icon"], 123], ["!=",  ["get", "icon"], 456]]
// example for including only specific iconID ["any", ["==",  ["get", "icon"], 123], ["==",  ["get", "icon"], 456]]
export const buildIconArrayFilterExpression = (icons: number[], mode: POICategoriesFilterMode): FilterSpecification => {
    const expression: any = mode === "exclude" ? ["all"] : ["any"];
    icons?.forEach((icon) => expression.push(buildIconFilterExpression(icon, mode)));
    return expression;
};

export const combineWithExistingFilter = (
    icons: number[],
    mode: POICategoriesFilterMode,
    layerFilter?: FilterSpecification
): FilterSpecification => {
    const categoryFilter = buildIconArrayFilterExpression(icons, mode);
    if (layerFilter) {
        return ["all", categoryFilter, layerFilter] as FilterSpecification;
    }
    return categoryFilter;
};
