import type { FetchInput } from '../../shared';

/**
 * @ignore
 */
export type ReachableRangePostData = {
    origin: { type: 'Point'; coordinates: [number, number] };
    departureDateTime?: string;
    traffic?: string;
    vehicleMaxSpeedInKilometersPerHour?: number;
    vehicleWeightInKilograms?: number;
};

/**
 * @ignore
 */
export type ReachableRangeRequestAPI = FetchInput<ReachableRangePostData>;
