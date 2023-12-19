import {
    ChargingPark,
    EVChargingStationPlaceProps,
    EVChargingStationsAvailability,
    Place,
    Places
} from "@anw/maps-sdk-js/core";
import { EVChargingStationsAvailabilityParams } from "./types/evChargingStationsAvailabilityParams";
import { callService } from "../shared/serviceTemplate";
import {
    evChargingStationsAvailabilityTemplate,
    EVChargingStationsAvailabilityTemplate
} from "./evChargingStationsAvailabilityTemplate";

/**
 * The Electric Vehicle (EV) Charging Stations Availability Service provides information about the current availability of charging spots.
 * @param params Mandatory and optional parameters.
 * @param customTemplate Advanced parameter to plug in how the service treats requests and responses.
 */
export const evChargingStationsAvailability = async (
    params: EVChargingStationsAvailabilityParams,
    customTemplate?: Partial<EVChargingStationsAvailabilityTemplate>
): Promise<EVChargingStationsAvailability> =>
    callService(
        params,
        { ...evChargingStationsAvailabilityTemplate, ...customTemplate },
        "EVChargingStationsAvailability"
    );

/**
 * The Electric Vehicle (EV) Charging Stations Availability Service provides information about the current availability of charging spots.
 *
 * This function returns the given place with EV availability aggregated in its properties, if applicable.
 * @param place The place for which to fetch EV charging availability.
 * If it's not an EV station or has no availability info, it will be returned as-is.
 */
export const buildPlaceWithEVAvailability = async (place: Place): Promise<Place<EVChargingStationPlaceProps>> => {
    const availabilityID = place.properties.dataSources?.chargingAvailability?.id;
    if (!availabilityID) {
        return place;
    }
    try {
        return {
            ...place,
            properties: {
                ...place.properties,
                chargingPark: {
                    ...(place.properties.chargingPark as ChargingPark),
                    availability: await evChargingStationsAvailability({ id: availabilityID })
                }
            }
        };
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
 * The ones that aren't EV stations or have no availability info are returned as-is.
 */
export const buildPlacesWithEVAvailability = async (places: Places): Promise<Places<EVChargingStationPlaceProps>> => {
    const placesWithAvailability = [];
    for (const place of places.features) {
        // (We fetch the availabilities sequentially on purpose to prevent QPS limit errors)
        placesWithAvailability.push(await buildPlaceWithEVAvailability(place));
    }
    return { ...places, features: placesWithAvailability };
};

export default evChargingStationsAvailability;
