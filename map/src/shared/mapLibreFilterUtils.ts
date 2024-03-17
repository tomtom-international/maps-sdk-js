import type { ExpressionFilterSpecification, FilterSpecification, LegacyFilterSpecification } from "maplibre-gl";
import type { FilterShowMode, FilterSyntaxVersion, MultiSyntaxFilter, ValuesFilter } from "./types";

/**
 * @ignore
 */
const isExpressionFilter = (filter: FilterSpecification): filter is ExpressionFilterSpecification => {
    if (filter === true || filter === false) {
        return true;
    }

    if (!Array.isArray(filter) || filter.length === 0) {
        return false;
    }
    switch (filter[0]) {
        case "has":
            return filter.length >= 2 && filter[1] !== "$id" && filter[1] !== "$type";

        case "in":
            return filter.length >= 3 && (typeof filter[1] !== "string" || Array.isArray(filter[2]));

        case "!in":
        case "!has":
        case "none":
            return false;

        case "==":
        case "!=":
        case ">":
        case ">=":
        case "<":
        case "<=":
            return filter.length !== 3 || Array.isArray(filter[1]) || Array.isArray(filter[2]);

        case "any":
        case "all":
            for (const f of filter.slice(1)) {
                if (!isExpressionFilter(f as FilterSpecification) && typeof f !== "boolean") {
                    return false;
                }
            }
            return true;

        default:
            return true;
    }
};

/**
 * @ignore
 */
export const getSyntaxVersion = (expression: FilterSpecification): FilterSyntaxVersion =>
    isExpressionFilter(expression) ? "expression" : "legacy";

/**
 * @ignore
 */
export const getMergedAnyFilter = (filters: MultiSyntaxFilter[]): MultiSyntaxFilter | null => {
    if (!filters?.length) {
        return null;
    } else if (filters.length === 1) {
        return filters[0];
    } else {
        return {
            expression: ["any", ...filters.map((filter) => filter?.expression)],
            legacy: ["any", ...filters.map((filter) => filter?.legacy)]
        };
    }
};

/**
 * @ignore
 */
export const getMergedAllFilter = (
    filterToAdd: MultiSyntaxFilter,
    originalFilter: FilterSpecification | undefined
): FilterSpecification => {
    if (originalFilter) {
        return ["all", filterToAdd[getSyntaxVersion(originalFilter)], originalFilter] as FilterSpecification;
    } else {
        return filterToAdd.expression;
    }
};

/**
 * @ignore
 */
export const buildMappedValuesFilter = <T>(
    propName: string,
    showMode: FilterShowMode,
    values: T[]
): MultiSyntaxFilter => {
    if (values.length === 1) {
        const comparator = showMode === "only" ? "==" : "!=";
        return {
            expression: [comparator, ["get", propName], values[0]] as ExpressionFilterSpecification,
            legacy: [comparator, propName, values[0]] as LegacyFilterSpecification
        };
    } else {
        const filterArrayNew = ["in", ["get", propName], ["literal", values]];
        if (showMode === "only") {
            return {
                expression: filterArrayNew as ExpressionFilterSpecification,
                legacy: ["in", propName, ...values] as LegacyFilterSpecification
            };
        } else {
            return {
                expression: ["!", filterArrayNew as ExpressionFilterSpecification],
                legacy: ["!in", propName, ...values] as LegacyFilterSpecification
            };
        }
    }
};

/**
 * @ignore
 */
export const buildValuesFilter = <T>(
    propName: string,
    filter: ValuesFilter<T>,
    valuesMapping?: (value: T) => unknown
): MultiSyntaxFilter =>
    buildMappedValuesFilter(propName, filter.show, valuesMapping ? filter.values.map(valuesMapping) : filter.values);
