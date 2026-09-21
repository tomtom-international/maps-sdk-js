import { indexedMagnitudes } from '@tomtom-org/maps-sdk/core';
import { isNil } from 'lodash-es';
import type { ExpressionFilterSpecification, ExpressionSpecification, LayerSpecification } from 'maplibre-gl';
import type { ValuesFilter } from '../../shared';
import type { LayerFilterComposer } from '../../shared/layers/layerFilterComposer';
import { buildValuesFilter, getMergedAnyFilter } from '../../shared/mapLibreFilterUtils';
import type { TrafficCommonFilter } from '../types/trafficCommonConfig';
import type { TrafficFlowFilter, TrafficFlowFilters } from '../types/trafficFlowConfig';
import type { DelayFilter, TrafficIncidentsFilter, TrafficIncidentsFilters } from '../types/trafficIncidentsConfig';
import { incidentToIconCategoryMapping } from '../util/trafficIncidentMapping';

const toAllFilter = (expressions: ExpressionFilterSpecification[]): ExpressionFilterSpecification | null => {
    if (!expressions.length) {
        return null;
    }
    if (expressions.length === 1) {
        return expressions[0];
    }

    return ['all', ...expressions] as ExpressionSpecification;
};

const delayFilterToMapLibre = (delayFilter: DelayFilter): ExpressionFilterSpecification | null => {
    const expressions: ExpressionFilterSpecification[] = [];
    if (delayFilter.mustHaveDelay && delayFilter.minDelayMinutes) {
        // there must be a delay and with the min specified value:
        const delaySeconds = delayFilter.minDelayMinutes * 60;
        expressions.push(['>=', ['get', 'delay'], delaySeconds]);
    } else if (delayFilter.mustHaveDelay) {
        // just expects a delay of any kind
        expressions.push(['>', ['get', 'delay'], 0]);
    } else if (delayFilter.minDelayMinutes) {
        // Min delay expected, but also allows for non-existing delays:
        const delaySeconds = delayFilter.minDelayMinutes * 60;
        expressions.push([
            'any',
            ['!', ['has', 'delay']],
            ['==', ['get', 'delay'], 0],
            ['>=', ['get', 'delay'], delaySeconds],
        ]);
    }

    return toAllFilter(expressions);
};

const addFilter = (
    filter: ExpressionFilterSpecification | undefined | null,
    expressions: ExpressionFilterSpecification[],
) => {
    if (filter) {
        expressions.push(filter);
    }
};

const addValuesFilter = (
    valuesFilter: ValuesFilter<string> | undefined,
    propertyName: string,
    expressions: ExpressionFilterSpecification[],
) => {
    if (valuesFilter) {
        addFilter(buildValuesFilter(propertyName, valuesFilter), expressions);
    }
};

const addCommonFilterExpressions = (
    sdkFilter: TrafficCommonFilter,
    expressions: ExpressionFilterSpecification[],
): void => {
    addValuesFilter(sdkFilter.roadCategories, 'road_category', expressions);
    addValuesFilter(sdkFilter.roadSubCategories, 'road_subcategory', expressions);
};

const buildMapLibreIncidentsFilter = (sdkFilter: TrafficIncidentsFilter): ExpressionFilterSpecification | null => {
    const expressions: ExpressionFilterSpecification[] = [];

    addCommonFilterExpressions(sdkFilter, expressions);

    if (sdkFilter.incidentCategories) {
        const incidentCategoryFilter = buildValuesFilter(
            'icon_category_0',
            sdkFilter.incidentCategories,
            (value) => incidentToIconCategoryMapping[value],
        );
        addFilter(incidentCategoryFilter, expressions);
    }
    if (sdkFilter.magnitudes) {
        const magnitudesFilter = buildValuesFilter('magnitude_of_delay', sdkFilter.magnitudes, (magnitude) =>
            indexedMagnitudes.indexOf(magnitude),
        );
        addFilter(magnitudesFilter, expressions);
    }
    if (sdkFilter.delays) {
        addFilter(delayFilterToMapLibre(sdkFilter.delays), expressions);
    }

    return toAllFilter(expressions);
};

/**
 * @ignore
 */
export const buildMapLibreIncidentFilters = (
    incidentFilters: TrafficIncidentsFilters,
): ExpressionFilterSpecification | null => {
    if (!incidentFilters?.any?.length) {
        return null;
    }
    const mapLibreFilters = incidentFilters.any
        .map(buildMapLibreIncidentsFilter)
        .filter((mapLibreFilter) => !isNil(mapLibreFilter));
    return getMergedAnyFilter(mapLibreFilters);
};

const buildMapLibreFlowFilter = (sdkFilter: TrafficFlowFilter): ExpressionFilterSpecification | null => {
    const expressions: ExpressionFilterSpecification[] = [];

    addCommonFilterExpressions(sdkFilter, expressions);
    if (sdkFilter.showRoadClosures) {
        const operator = sdkFilter.showRoadClosures === 'only' ? '==' : '!=';
        expressions.push([operator, ['get', 'road_closure'], true]);
    }

    return toAllFilter(expressions);
};

/**
 * @ignore
 */
export const buildMapLibreFlowFilters = (flowFilters: TrafficFlowFilters): ExpressionFilterSpecification | null => {
    if (!flowFilters?.any?.length) {
        return null;
    }
    const mapLibreFilters = flowFilters.any
        .map(buildMapLibreFlowFilter)
        .filter((mapLibreFilter) => !isNil(mapLibreFilter));
    return getMergedAnyFilter(mapLibreFilters);
};

/**
 * Narrows the given style layers by `filter`, or with `undefined` leaves them to whatever the style
 * and the other contributors filter them by.
 *
 * One key per module, not per call: the incident and icon filters land on disjoint layer sets, and a
 * later call that covers both sets is meant to replace what the earlier one put there.
 *
 * @ignore
 * @param filter
 * @param layers
 * @param filterComposer
 * @param contributor
 */
export const applyFilter = (
    filter: ExpressionFilterSpecification | undefined,
    layers: LayerSpecification[],
    filterComposer: LayerFilterComposer,
    contributor: string,
) => {
    for (const layer of layers) {
        filterComposer.setClause(layer.id, contributor, filter);
    }
};
