import type { DelayMagnitude, TrafficIncidentCategory } from '../types';

/**
 * @ignore
 */
export const indexedMagnitudes: DelayMagnitude[] = ['unknown', 'minor', 'moderate', 'major', 'indefinite'];

/**
 * Maps an `iconCategory` integer from the Incident Details API to a {@link TrafficIncidentCategory}.
 *
 * @remarks
 * Integer values that do not correspond to a known category are mapped to `'other'`.
 *
 * | Value | Category           |
 * |-------|--------------------|
 * | 0     | `other` (unknown)  |
 * | 1     | `accident`         |
 * | 2     | `fog`              |
 * | 3     | `danger`           |
 * | 4     | `rain`             |
 * | 5     | `frost`            |
 * | 6     | `jam`              |
 * | 7     | `lane-closed`      |
 * | 8     | `road-closed`      |
 * | 9     | `roadworks`        |
 * | 10    | `wind`             |
 * | 11    | `flooding`         |
 * | 12    | `animals-on-road`  |
 * | 13    | `narrow-lanes`     |
 * | 14    | `broken-down-vehicle` |
 *
 * @param iconCategory - Integer category code from the API response
 * @returns The corresponding {@link TrafficIncidentCategory}
 *
 * @ignore
 */
export const iconToTrafficIncidentCategory = (iconCategory: number): TrafficIncidentCategory => {
    switch (iconCategory) {
        case 1:
            return 'accident';
        case 2:
            return 'fog';
        case 3:
            return 'danger';
        case 4:
            return 'rain';
        case 5:
            return 'frost';
        case 6:
            return 'jam';
        case 7:
            return 'lane-closed';
        case 8:
            return 'road-closed';
        case 9:
            return 'roadworks';
        case 10:
            return 'wind';
        case 11:
            return 'flooding';
        case 12:
            return 'animals-on-road';
        case 13:
            return 'narrow-lanes';
        case 14:
            return 'broken-down-vehicle';
        default:
            return 'other';
    }
};
