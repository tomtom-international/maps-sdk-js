import { indexedMagnitudes } from "@anw/maps-sdk-js/core";
import { ExpressionFilterSpecification, LegacyFilterSpecification } from "maplibre-gl";
import isNil from "lodash/isNil";
import {
    DelayFilter,
    incidentCategoriesMapping,
    TrafficCommonFilter,
    TrafficFlowFilter,
    TrafficFlowFilters,
    TrafficIncidentsFilter,
    TrafficIncidentsFilters
} from "../types/VectorTilesTrafficConfig";
import { MultiSyntaxFilter, ValuesFilter } from "../../shared";
import { buildValuesFilter, getMergedAnyFilter } from "../../shared/MapLibreFilterUtils";

const toMultiSyntaxAllFilter = (
    newSyntaxExpressions: unknown[],
    legacySyntaxExpressions: unknown[]
): MultiSyntaxFilter | null => {
    if (!newSyntaxExpressions.length) {
        return null;
    } else if (newSyntaxExpressions.length === 1) {
        return {
            expression: newSyntaxExpressions[0] as ExpressionFilterSpecification,
            legacy: legacySyntaxExpressions[0] as LegacyFilterSpecification
        };
    } else {
        return {
            expression: ["all", ...newSyntaxExpressions] as ExpressionFilterSpecification,
            legacy: ["all", ...legacySyntaxExpressions] as LegacyFilterSpecification
        };
    }
};

const delayFilterToMapLibre = (delayFilter: DelayFilter): MultiSyntaxFilter | null => {
    const newSyntaxExpressions = [];
    const legacySyntaxExpressions = [];
    if (delayFilter.mustHaveDelay && delayFilter.minDelayMinutes) {
        // there must be a delay and with the min specified value:
        const delaySeconds = delayFilter.minDelayMinutes * 60;
        newSyntaxExpressions.push([">=", ["get", "delay"], delaySeconds]);
        legacySyntaxExpressions.push([">=", "delay", delaySeconds]);
    } else if (delayFilter.mustHaveDelay) {
        // just expects a delay of any kind
        newSyntaxExpressions.push([">", ["get", "delay"], 0]);
        legacySyntaxExpressions.push([">", "delay", 0]);
    } else if (delayFilter.minDelayMinutes) {
        // Min delay expected, but also allows for non-existing delays:
        const delaySeconds = delayFilter.minDelayMinutes * 60;
        newSyntaxExpressions.push([
            "any",
            ["!", ["has", "delay"]],
            ["==", ["get", "delay"], 0],
            [">=", ["get", "delay"], delaySeconds]
        ]);
        legacySyntaxExpressions.push(["any", ["!has", "delay"], ["==", "delay", 0], [">=", "delay", delaySeconds]]);
    }
    return toMultiSyntaxAllFilter(newSyntaxExpressions, legacySyntaxExpressions);
};

const addFilter = (
    filter: MultiSyntaxFilter | undefined | null,
    newSyntaxExpressions: unknown[],
    legacySyntaxExpressions: unknown[]
) => {
    if (filter) {
        newSyntaxExpressions.push(filter.expression);
        legacySyntaxExpressions.push(filter.legacy);
    }
};

const addValuesFilter = (
    valuesFilter: ValuesFilter<string> | undefined,
    propName: string,
    newSyntaxExpressions: unknown[],
    legacySyntaxExpressions: unknown[]
) => {
    if (valuesFilter) {
        addFilter(buildValuesFilter(propName, valuesFilter), newSyntaxExpressions, legacySyntaxExpressions);
    }
};

const addCommonFilterExpressions = (
    sdkFilter: TrafficCommonFilter,
    newSyntaxExpressions: unknown[],
    legacySyntaxExpressions: unknown[]
): void => {
    addValuesFilter(sdkFilter.roadCategories, "road_category", newSyntaxExpressions, legacySyntaxExpressions);
    addValuesFilter(sdkFilter.roadSubCategories, "road_subcategory", newSyntaxExpressions, legacySyntaxExpressions);
};

const buildMapLibreIncidentsFilter = (sdkFilter: TrafficIncidentsFilter): MultiSyntaxFilter | null => {
    const newSyntaxExpressions: unknown[] = [];
    const legacySyntaxExpressions: unknown[] = [];

    addCommonFilterExpressions(sdkFilter, newSyntaxExpressions, legacySyntaxExpressions);

    if (sdkFilter.incidentCategories) {
        const incidentCategoryFilter = buildValuesFilter(
            "icon_category_0",
            sdkFilter.incidentCategories,
            (value) => incidentCategoriesMapping[value]
        );
        addFilter(incidentCategoryFilter, newSyntaxExpressions, legacySyntaxExpressions);
    }
    if (sdkFilter.magnitudes) {
        const magnitudesFilter = buildValuesFilter("magnitude", sdkFilter.magnitudes, (magnitude) =>
            indexedMagnitudes.indexOf(magnitude)
        );
        addFilter(magnitudesFilter, newSyntaxExpressions, legacySyntaxExpressions);
    }
    if (sdkFilter.delays) {
        addFilter(delayFilterToMapLibre(sdkFilter.delays), newSyntaxExpressions, legacySyntaxExpressions);
    }

    return toMultiSyntaxAllFilter(newSyntaxExpressions, legacySyntaxExpressions);
};

/**
 * @ignore
 */
export const buildMapLibreIncidentFilters = (incidentFilters: TrafficIncidentsFilters): MultiSyntaxFilter | null => {
    if (!incidentFilters?.any?.length) {
        return null;
    } else {
        const mapLibreFilters = incidentFilters.any
            .map(buildMapLibreIncidentsFilter)
            .filter((mapLibreFilter) => !isNil(mapLibreFilter)) as MultiSyntaxFilter[];
        return getMergedAnyFilter(mapLibreFilters);
    }
};

const buildMapLibreFlowFilter = (sdkFilter: TrafficFlowFilter): MultiSyntaxFilter | null => {
    const newSyntaxExpressions: unknown[] = [];
    const legacySyntaxExpressions: unknown[] = [];

    addCommonFilterExpressions(sdkFilter, newSyntaxExpressions, legacySyntaxExpressions);
    if (sdkFilter.showRoadClosures) {
        const operator = sdkFilter.showRoadClosures == "only" ? "==" : "!=";
        newSyntaxExpressions.push([operator, ["get", "road_closure"], true]);
        legacySyntaxExpressions.push([operator, "road_closure", true]);
    }

    return toMultiSyntaxAllFilter(newSyntaxExpressions, legacySyntaxExpressions);
};

/**
 * @ignore
 */
export const buildMapLibreFlowFilters = (flowFilters: TrafficFlowFilters): MultiSyntaxFilter | null => {
    if (!flowFilters?.any?.length) {
        return null;
    } else {
        const mapLibreFilters = flowFilters.any
            .map(buildMapLibreFlowFilter)
            .filter((mapLibreFilter) => !isNil(mapLibreFilter)) as MultiSyntaxFilter[];
        return getMergedAnyFilter(mapLibreFilters);
    }
};
