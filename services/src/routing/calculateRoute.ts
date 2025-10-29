import type { Routes } from '@cet/maps-sdk-js/core';
import { callService } from '../shared/serviceTemplate';
import type { CalculateRouteTemplate } from './calculateRouteTemplate';
import { calculateRouteTemplate } from './calculateRouteTemplate';
import type { CalculateRouteParams } from './types/calculateRouteParams';

/**
 * Calculate optimal routes between locations with comprehensive routing options.
 *
 * The Calculate Route service computes the best path between an origin and destination,
 * optionally passing through intermediate waypoints. Routes account for real-time traffic,
 * vehicle characteristics, and user preferences.
 *
 * @remarks
 * This service provides:
 * - **Traffic-aware routing**: Uses current traffic and typical road speeds
 * - **Turn-by-turn guidance**: Optional navigation instructions
 * - **Alternative routes**: Multiple route options with different characteristics
 * - **EV routing**: Long-distance electric vehicle routing with charging stops
 * - **Consumption estimates**: Fuel or battery consumption calculations
 * - **Route sections**: Detailed breakdowns (tolls, ferries, traffic, countries)
 *
 * Route calculations consider:
 * - Current and historic traffic patterns
 * - Road types and speeds
 * - Vehicle specifications (dimensions, weight, engine type)
 * - User preferences (avoid tolls, motorways, ferries, etc.)
 * - Departure/arrival time
 *
 * @param params - Routing parameters including waypoints and options
 * @param customTemplate - Advanced customization for request/response handling
 *
 * @returns Promise resolving to calculated route(s) with geometry and metadata
 *
 * @example
 * ```typescript
 * // Basic route calculation
 * const route = await calculateRoute({
 *   key: 'your-api-key',
 *   locations: [
 *     [4.9041, 52.3676],  // Amsterdam
 *     [4.4777, 51.9244]   // Rotterdam
 *   ]
 * });
 *
 * // Route with guidance and alternatives
 * const guidedRoute = await calculateRoute({
 *   key: 'your-api-key',
 *   locations: [[4.9, 52.3], [4.5, 51.9]],
 *   guidance: { type: 'coded', phonetics: 'IPA' },
 *   maxAlternatives: 2,
 *   routeType: 'fastest',
 *   avoid: ['tollRoads'],
 *   departAt: new Date('2025-10-20T08:00:00Z')
 * });
 *
 * // Electric vehicle route with charging
 * const evRoute = await calculateRoute({
 *   key: 'your-api-key',
 *   locations: [[4.9, 52.3], [8.5, 50.1]],  // Long distance
 *   vehicleEngineType: 'electric',
 *   currentChargeInkWh: 50,
 *   maxChargeInkWh: 85,
 *   constantSpeedConsumptionInkWhPerHundredkm: [[50, 8], [80, 12], [120, 18]]
 * });
 *
 * // Multi-stop delivery route
 * const deliveryRoute = await calculateRoute({
 *   key: 'your-api-key',
 *   locations: [
 *     [4.9, 52.3],   // Warehouse
 *     [4.85, 52.32], // Stop 1
 *     [4.88, 52.35], // Stop 2
 *     [4.92, 52.38]  // Stop 3
 *   ],
 *   vehicleCommercial: true,
 *   vehicleLoadType: ['otherHazmatGeneral']
 * });
 * ```
 *
 * @see [Calculate Route API Documentation](https://docs.tomtom.com/routing-api/documentation/routing/calculate-route)
 * @see [Routing Quickstart Guide](https://docs.tomtom.com/maps-sdk-js/guides/services/routing/quickstart)
 * @see [Planning a Route Guide](https://docs.tomtom.com/maps-sdk-js/guides/services/routing/planning-a-route)
 * @see [Waypoints and Custom Routes Guide](https://docs.tomtom.com/maps-sdk-js/guides/services/routing/waypoints-and-custom-routes)
 * @see [Planning Criteria Guide](https://docs.tomtom.com/maps-sdk-js/guides/services/routing/planning-criteria)
 * @see [Route Sections Guide](https://docs.tomtom.com/maps-sdk-js/guides/services/routing/route-sections)
 * @see [Long Distance EV Routing Guide](https://docs.tomtom.com/maps-sdk-js/guides/services/routing/long-distance-ev-routing)
 *
 * @group Routing
 */
export const calculateRoute = async (
    params: CalculateRouteParams,
    customTemplate?: Partial<CalculateRouteTemplate>,
): Promise<Routes> => callService(params, { ...calculateRouteTemplate, ...customTemplate }, 'Routing');
