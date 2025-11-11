import type { Routes } from '@tomtom-org/maps-sdk/core';
import { callService } from '../shared/serviceTemplate';
import type { CalculateRouteTemplate } from './calculateRouteTemplate';
import { calculateRouteTemplate } from './calculateRouteTemplate';
import type { CalculateRouteParams } from './types/calculateRouteParams';

/**
 * Calculates a route between an origin and destination, optionally passing through extra waypoints.
 *
 * @param params - Route calculation parameters including locations, travel mode, and other options
 * @param customTemplate - Optional template customization for request/response handling
 * @returns Promise resolving to calculated route(s) with geometry, distance, and travel time
 *
 * @see [Calculate Route API Documentation](https://docs.tomtom.com/routing-api/documentation/tomtom-maps/calculate-route)
 *
 * @group Routing
 */
export const calculateRoute = async (
    params: CalculateRouteParams,
    customTemplate?: Partial<CalculateRouteTemplate>,
): Promise<Routes> => callService(params, { ...calculateRouteTemplate, ...customTemplate }, 'Routing');
