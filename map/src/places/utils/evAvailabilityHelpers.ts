import type { ChargingPark, ChargingParkWithAvailability, Place, POICategory } from '@tomtom-org/maps-sdk/core';
import type { ExpressionSpecification } from 'maplibre-gl';
import { suffixNumber } from '../../shared/layers/utils';
import type { AvailabilityLevel } from '../../shared/types/image';
import type { EVAvailabilityConfig, PlacesModuleConfig, PlacesTheme } from '../types/placesModuleConfig';

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
 * Default threshold for EV availability - available vs occupied.
 * @ignore
 */
export const DEFAULT_EV_AVAILABILITY_THRESHOLD = 0;

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
export const getAvailabilityColorExpression = (config?: EVAvailabilityConfig): ExpressionSpecification => {
    const threshold = config?.threshold ?? DEFAULT_EV_AVAILABILITY_THRESHOLD;

    return ['case', ['>=', ['get', 'evAvailabilityRatio'], threshold], 'green', 'red'] as ExpressionSpecification;
};

/**
 * Handles icon selection for EV stations with availability data.
 * Returns icon ID if availability-specific icon should be used, or undefined to fall through to regular selection.
 * @ignore
 */
export const getEVAvailabilityIconID = (
    place: Place,
    poiCategory: POICategory,
    instanceIndex: number,
    config: PlacesModuleConfig,
    iconTheme: PlacesTheme,
): string | undefined => {
    if (!config.evAvailability?.enabled || !isEVStationWithAvailability(place)) {
        return undefined;
    }

    const ratio = getAvailabilityRatio(place);
    const threshold = config.evAvailability.threshold ?? 0.3;
    const requiredLevel: AvailabilityLevel = ratio >= threshold ? 'available' : 'occupied';
    const hasCustomIcons = config.icon?.categoryIcons && config.icon.categoryIcons.length > 0;

    const customIconWithAvailability = config.icon?.categoryIcons?.find(
        (customIcon) => customIcon.id === poiCategory && customIcon.availabilityLevel === requiredLevel,
    );

    // If a custom icon with the required availability level exists, use it
    if (customIconWithAvailability) {
        return suffixNumber(`${customIconWithAvailability.id}-${requiredLevel}`, instanceIndex);
    }

    // For pin theme: use CDN availability sprites when no custom icons are defined
    if (!hasCustomIcons && iconTheme === 'pin') {
        return `7309-${requiredLevel}`;
    }

    // Otherwise, fall through to regular icon selection
    return undefined;
};
