import { skipToken, useQuery } from '@tanstack/react-query';
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

/** The live report behind a traffic section, joined by its `eventId`. */
export const useIncident = (eventId?: string) =>
    useQuery({
        queryKey: ['incident', eventId],
        queryFn: eventId
            ? async ({ signal }) =>
                  (await trafficIncidentDetails({ ids: [eventId], signal })).features[0]?.properties ?? null
            : skipToken,
    });
