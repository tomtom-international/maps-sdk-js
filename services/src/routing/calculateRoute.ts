import type { Routes } from '@anw/maps-sdk-js/core';
import type { CalculateRouteParams } from './types/calculateRouteParams';
import type { CalculateRouteTemplate } from './calculateRouteTemplate';
import { calculateRouteTemplate } from './calculateRouteTemplate';
import { callService } from '../shared/serviceTemplate';

/**
 * The Calculate Route service calculates a route between an origin and a destination,
 * passing through waypoints if they are specified.
 *
 * * The route will take into account factors such as current traffic and the typical road speeds
 * on the requested day of the week and time of day.
 * * Information returned includes the distance, estimated travel time, and a representation of the route geometry.
 * * Additional routing information such as optimized waypoint order or turn by turn instructions is also available,
 * depending on the options selected.
 * @param params Mandatory and optional parameters, with the global configuration automatically included.
 * @param customTemplate Advanced optional parameter to plug in how the service treats requests and responses.
 * @see https://developer.tomtom.com/routing-api/documentation/routing/calculate-route
 */
export const calculateRoute = async (
    params: CalculateRouteParams,
    customTemplate?: Partial<CalculateRouteTemplate>,
): Promise<Routes> => callService(params, { ...calculateRouteTemplate, ...customTemplate }, 'Routing');
