import type {
    ChargingPark,
    ChargingStationsAvailability,
    EVChargingStationPlaceProps,
    Place,
    Places,
} from '@anw/maps-sdk-js/core';
import { bboxFromGeoJSON } from '@anw/maps-sdk-js/core';
import { callService } from '../shared/serviceTemplate';
import type { EVChargingStationsAvailabilityTemplate } from './evChargingStationsAvailabilityTemplate';
import { evChargingStationsAvailabilityTemplate } from './evChargingStationsAvailabilityTemplate';
import type { ChargingStationsAvailabilityParams } from './types/evChargingStationsAvailabilityParams';

/**
 * The Electric Vehicle (EV) Charging Stations Availability Service provides information about the current availability of charging spots.
 * @param params Mandatory and optional parameters.
 * @param customTemplate Advanced parameter to plug in how the service treats requests and responses.
 */
export const evChargingStationsAvailability = async (
    params: ChargingStationsAvailabilityParams,
    customTemplate?: Partial<EVChargingStationsAvailabilityTemplate>,
): Promise<ChargingStationsAvailability | undefined> =>
    callService(
        params,
        { ...evChargingStationsAvailabilityTemplate, ...customTemplate },
        'EVChargingStationsAvailability',
    );

/**
 * The Electric Vehicle (EV) Charging Stations Availability Service provides information about the current availability of charging spots.
 *
 * This function returns the given place with EV availability aggregated in its properties, if applicable.
 * @param place The place for which to fetch EV charging availability.
 * If it's not an EV station or has no availability info, it will be returned as-is.
 */
export const buildPlaceWithEVAvailability = async (place: Place): Promise<Place<EVChargingStationPlaceProps>> => {
    const availabilityId = place.properties.dataSources?.chargingAvailability?.id;
    if (!availabilityId) {
        return place;
    }
    try {
        const availability = await evChargingStationsAvailability({ id: availabilityId });
        const poi = place.properties.poi;
        return availability
            ? {
                  ...place,
                  properties: {
                      ...place.properties,
                      // We override poi opening hours with the ones from the EV call, which might be better supported:
                      ...(poi && { poi: { ...poi, openingHours: availability.openingHours } }),
                      chargingPark: {
                          ...(place.properties.chargingPark as ChargingPark),
                          availability,
                      },
                  },
              }
            : (place as Place<EVChargingStationPlaceProps>);
    } catch (e) {
        // (Likely a QPS limit error)
        console.error(e);
        return place;
    }
};

/**
 * The Electric Vehicle (EV) Charging Stations Availability Service provides information about the current availability of charging spots.
 *
 * This function returns the given place with EV availability aggregated in its properties, if applicable.
 * @param places The places for which to fetch EV charging availability.
 * @param options Optional parameters.
 * The ones that aren't EV stations or have no availability info are returned as-is.
 */
export const buildPlacesWithEVAvailability = async (
    places: Places,
    options: {
        /**
         * If true, places with unknown availability will be still included. Otherwise, they will be filtered out.
         * @default true
         */
        includeIfAvailabilityUnknown: boolean;
    } = { includeIfAvailabilityUnknown: true },
): Promise<Places<EVChargingStationPlaceProps>> => {
    const placesWithAvailability = [];
    for (const place of places.features) {
        // (We fetch the availabilities sequentially on purpose to prevent QPS limit errors)
        const placeWithAvailability = await buildPlaceWithEVAvailability(place);
        if (placeWithAvailability.properties.chargingPark?.availability || options.includeIfAvailabilityUnknown) {
            placesWithAvailability.push(placeWithAvailability);
        }
    }
    return { ...places, features: placesWithAvailability, bbox: bboxFromGeoJSON(placesWithAvailability) };
};

export default evChargingStationsAvailability;
