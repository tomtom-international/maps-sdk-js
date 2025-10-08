import type { PolygonFeature, PolygonFeatures } from '@cet/maps-sdk-js/core';
import { callService } from '../shared/serviceTemplate';
import type { ReachableRangeTemplate } from './reachableRangeTemplate';
import { reachableRangeTemplate } from './reachableRangeTemplate';
import type { ReachableRangeParams } from './types/reachableRangeParams';

/**
 * The Calculate Reachable Range service calculates a set of locations that can be reached from the origin point.
 * * It optimizes routes with a given route-type (e.g., fastest, eco, etc.)
 * * It limits the range for the given budget and consumption parameters.
 * @param params Mandatory and optional parameters, with the global configuration automatically included.
 * @param customTemplate Advanced optional parameter to plug in how the service treats requests and responses.
 * @see https://docs.tomtom.com/routing-api/documentation/routing/calculate-reachable-range
 */
export const calculateReachableRange = async (
    params: ReachableRangeParams,
    customTemplate?: Partial<ReachableRangeTemplate>,
): Promise<PolygonFeature<ReachableRangeParams>> =>
    callService(params, { ...reachableRangeTemplate, ...customTemplate }, 'Reachable Range');

/**
 * The Calculate Reachable Ranges service calculates a set of locations that can be reached from the origin point.
 * * Calls calculateReachableRange for each of the given parameters.
 * * For each range, it optimizes routes with a given route-type (e.g., fastest, eco, etc.).
 * * For each range, it limits the range for the given budget and consumption parameters.
 * * If any of the range calculations fail, the whole request fails and the error is returned.
 * @param paramsArray An array of parameters to calculate ranges from. Each of them consists of Mandatory and optional parameters, with the global configuration automatically included.
 * @param customTemplate Advanced optional parameter to plug in how the service treats requests and responses.
 * @see https://docs.tomtom.com/routing-api/documentation/routing/calculate-reachable-range
 */
export const calculateReachableRanges = async (
    paramsArray: ReachableRangeParams[],
    customTemplate?: Partial<ReachableRangeTemplate>,
): Promise<PolygonFeatures<ReachableRangeParams>> => {
    const features = [];
    for (const params of paramsArray) {
        // we sequentially fetch reachable ranges (less speed but better to prevent QPS limit breaches):
        features.push(await calculateReachableRange(params, customTemplate));
    }
    return { type: 'FeatureCollection', features: features };
};
