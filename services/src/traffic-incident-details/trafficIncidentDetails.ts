import type { TrafficIncidentDetails } from '@tomtom-org/maps-sdk/core';
import { callService } from '../shared/serviceTemplate';
import type { TrafficIncidentDetailsTemplate } from './trafficIncidentDetailsTemplate';
import { trafficIncidentDetailsTemplate } from './trafficIncidentDetailsTemplate';
import type { TrafficIncidentDetailsParams } from './types/trafficIncidentDetailsParams';

/**
 * Fetch detailed information about traffic incidents.
 *
 * Query incidents either by a geographic bounding box or by a list of incident IDs.
 * Results are GeoJSON Features whose geometry is a `Point` (localised incidents) or
 * a `LineString` (incidents spanning a stretch of road).
 *
 * @remarks
 * **Two query modes:**
 *
 * - **Bounding box** (`bbox`): Returns all incidents within the given area.
 *   Maximum area is 10,000 km².
 * - **By IDs** (`ids`): Returns the specified incidents directly.
 *   GET is used automatically for up to 5 IDs; POST for up to 100 IDs.
 *
 * **Key data provided per incident:**
 * - Category (`iconCategory`): type of incident (accident, roadworks, jam, etc.)
 * - Delay magnitude: severity of the delay (`minor`, `moderate`, `major`, …)
 * - Geometry: exact location or extent of the incident on the road network
 * - Time information: start/end times and whether the incident is `present` or `future`
 * - Events: one or more detailed event descriptions
 *
 * @param params - Traffic Incident Details parameters (bbox or ids)
 * @param customTemplate - Advanced customization for request/response handling
 *
 * @returns Promise resolving to a {@link TrafficIncidentDetails} object containing the matching incidents
 *
 * @example
 * ```typescript
 * // Query by bounding box (Amsterdam area)
 * const result = await trafficIncidentDetails({
 *   bbox: [4.728, 52.278, 5.080, 52.479]
 * });
 *
 * result.incidents.forEach(incident => {
 *   console.log(incident.properties.iconCategory);    // 'accident' | 'jam' | …
 *   console.log(incident.properties.magnitudeOfDelay); // 'minor' | 'major' | …
 *   console.log(incident.geometry);                    // Point or LineString
 * });
 * ```
 *
 * @example
 * ```typescript
 * // Query up to 5 specific incidents by ID (GET)
 * const result = await trafficIncidentDetails({
 *   ids: ['incident-id-1', 'incident-id-2']
 * });
 * ```
 *
 * @example
 * ```typescript
 * // Query many incident IDs — POST is used automatically when ids.length > 5
 * const result = await trafficIncidentDetails({
 *   ids: largeIdArray
 * });
 * ```
 *
 * @example
 * ```typescript
 * // Filter by category and include future incidents
 * const result = await trafficIncidentDetails({
 *   bbox: [4.728, 52.278, 5.080, 52.479],
 *   categoryFilter: ['accident', 'road-closed'],
 *   timeValidityFilter: ['present', 'future']
 * });
 * ```
 *
 * @see [Incident Details API Documentation](https://docs.tomtom.com/traffic-api/documentation/tomtom-orbis-maps/traffic-incidents/incident-details)
 * @see [Incident Details Guide](https://docs.tomtom.com/maps-sdk-js/guides/services/traffic/incident-details)
 *
 * @group Traffic
 */
export const trafficIncidentDetails = async (
    params: TrafficIncidentDetailsParams,
    customTemplate?: Partial<TrafficIncidentDetailsTemplate>,
): Promise<TrafficIncidentDetails> =>
    callService(params, { ...trafficIncidentDetailsTemplate, ...customTemplate }, 'TrafficIncidentDetails');
