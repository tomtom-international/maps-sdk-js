import { skipToken, useQuery } from '@tanstack/react-query';
import { getSectionBBox, type Route, type TrafficSectionProps } from '@tomtom-org/maps-sdk/core';
import { reverseGeocode, trafficIncidentDetails } from '@tomtom-org/maps-sdk/services';
import type { RoutePosition } from './sectionDetails';

/** The town or district at a point of the route, which the route itself never names. */
export const useLocality = (position: RoutePosition) =>
    useQuery({
        queryKey: ['locality', position[0], position[1]],
        queryFn: async ({ signal }) => {
            const address = (await reverseGeocode({ position, signal })).properties?.address;
            return (
                address?.municipality ??
                address?.municipalitySubdivision ??
                address?.countrySecondarySubdivision ??
                null
            );
        },
        staleTime: Number.POSITIVE_INFINITY,
    });

/**
 * The live report behind a traffic section. Its `eventId` is the tail of the incident's `id`, so the
 * lookup queries the section's area rather than the id.
 */
export const useIncident = (route: Route, section: TrafficSectionProps) => {
    const { eventId } = section;
    const bbox = getSectionBBox(route, section);
    return useQuery({
        queryKey: ['incident', eventId],
        queryFn:
            eventId && bbox
                ? async ({ signal }) => {
                      const incidents = await trafficIncidentDetails({ bbox, signal });
                      return (
                          incidents.features.find(({ properties }) => properties.id.endsWith(eventId))?.properties ??
                          null
                      );
                  }
                : skipToken,
    });
};
