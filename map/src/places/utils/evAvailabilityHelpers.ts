import type { ChargingPark, ChargingParkWithAvailability, Place } from '@tomtom-org/maps-sdk/core';
import type { EVAvailabilityConfig } from '../types/placesModuleConfig';

/**
 * Type guard to check if a charging park has availability data.
 * @ignore
 */
export const hasChargingAvailability = (
    chargingPark: ChargingPark | ChargingParkWithAvailability | undefined,
): chargingPark is ChargingParkWithAvailability =>
    Boolean(chargingPark && 'availability' in chargingPark && chargingPark.availability);

/**
 * Check if a place is an EV charging station with availability data.
 * @ignore
 */
export const isEVStationWithAvailability = (place: Place): boolean => {
    const category = place.properties.poi?.classifications?.[0]?.code;
    return category === 'ELECTRIC_VEHICLE_STATION' && hasChargingAvailability(place.properties.chargingPark);
};

/**
 * Calculate charging point availability information.
 * @ignore
 */
export const getChargingPointAvailability = (
    place: Place,
): { availableCount: number; totalCount: number; ratio: number } | undefined => {
    const chargingPark = place.properties.chargingPark;
    if (hasChargingAvailability(chargingPark)) {
        const availability = chargingPark.availability.chargingPointAvailability;
        const available = availability.statusCounts.Available ?? 0;
        return {
            availableCount: available,
            totalCount: availability.count,
            ratio: available / availability.count,
        };
    }
    return undefined;
};

/**
 * Default thresholds for EV availability color coding.
 * @ignore
 */
export const DEFAULT_EV_AVAILABILITY_THRESHOLDS = {
    high: 0.25,
    low: 0,
};

/**
 * Default formatter for EV availability text.
 * @ignore
 */
export const defaultFormatAvailabilityText = (available: number, total: number): string => `${available}/${total}`;

/**
 * Build availability text for a place with EV availability data.
 * @ignore
 */
export const buildAvailabilityText = (place: Place, config?: EVAvailabilityConfig): string => {
    const availability = getChargingPointAvailability(place);
    if (!availability) {
        return '';
    }

    const formatFn = config?.formatText ?? defaultFormatAvailabilityText;
    return formatFn(availability.availableCount, availability.totalCount);
};

/**
 * Build availability ratio for a place with EV availability data.
 * @ignore
 */
export const getAvailabilityRatio = (place: Place): number => {
    const availability = getChargingPointAvailability(place);
    return availability?.ratio ?? 0;
};

/**
 * Get the color expression for EV availability based on ratio.
 * @ignore
 */
export const getAvailabilityColorExpression = (config?: EVAvailabilityConfig): any[] => {
    const thresholds = {
        high: config?.thresholds?.high ?? DEFAULT_EV_AVAILABILITY_THRESHOLDS.high,
        low: config?.thresholds?.low ?? DEFAULT_EV_AVAILABILITY_THRESHOLDS.low,
    };

    return [
        'case',
        ['>=', ['get', 'evAvailabilityRatio'], thresholds.high],
        'green',
        ['>', ['get', 'evAvailabilityRatio'], thresholds.low],
        'orange',
        'red',
    ];
};
