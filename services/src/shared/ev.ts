import { ChargingSpeed } from '@tomtom-org/maps-sdk/core';

/**
 * @ignore
 */
export const toChargingSpeed = (powerInKW: number): ChargingSpeed => {
    if (powerInKW < 12) {
        return 'slow';
    } else if (powerInKW < 50) {
        return 'regular';
    } else if (powerInKW < 150) {
        return 'fast';
    }
    return 'ultra-fast';
};
