import type { DelayMagnitude, TrafficIncidentCategory } from '../types';

/**
 * @ignore
 */
export const indexedMagnitudes: DelayMagnitude[] = ['unknown', 'minor', 'moderate', 'major', 'indefinite'];

/**
 * Maps `iconCategory` integers from the Incident Details API to {@link TrafficIncidentCategory} strings.
 *
 * | Value | Category              |
 * |-------|-----------------------|
 * | 0     | `other` (unknown)     |
 * | 1     | `accident`            |
 * | 2     | `fog`                 |
 * | 3     | `danger`              |
 * | 4     | `rain`                |
 * | 5     | `frost`               |
 * | 6     | `jam`                 |
 * | 7     | `lane-closed`         |
 * | 8     | `road-closed`         |
 * | 9     | `roadworks`           |
 * | 10    | `wind`                |
 * | 11    | `flooding`            |
 * | 12    | `animals-on-road`     |
 * | 13    | `narrow-lanes`        |
 * | 14    | `broken-down-vehicle` |
 *
 * @ignore
 */
const iconCategoryMap: Record<number, TrafficIncidentCategory> = {
    1: 'accident',
    2: 'fog',
    3: 'danger',
    4: 'rain',
    5: 'frost',
    6: 'jam',
    7: 'lane-closed',
    8: 'road-closed',
    9: 'roadworks',
    10: 'wind',
    11: 'flooding',
    12: 'animals-on-road',
    13: 'narrow-lanes',
    14: 'broken-down-vehicle',
};

/**
 * Reverse of {@link iconCategoryMap} — maps {@link TrafficIncidentCategory} strings to API integer codes.
 * Categories not present in the forward map (i.e. `'other'`) resolve to `0`.
 *
 * @ignore
 */
const categoryToIconMap: Record<TrafficIncidentCategory, number> = Object.fromEntries(
    Object.entries(iconCategoryMap).map(([k, v]) => [v, Number(k)]),
) as Record<TrafficIncidentCategory, number>;

/**
 * Maps an `iconCategory` integer from the Incident Details API to a {@link TrafficIncidentCategory}.
 * Integer values that do not correspond to a known category are mapped to `'other'`.
 *
 * @param iconCategory - Integer category code from the API response
 * @returns The corresponding {@link TrafficIncidentCategory}
 *
 * @ignore
 */
export const iconToTrafficIncidentCategory = (iconCategory: number): TrafficIncidentCategory =>
    iconCategoryMap[iconCategory] ?? 'other';

/**
 * Maps a {@link TrafficIncidentCategory} string to the `iconCategory` integer used by the API.
 * `'other'` and any unrecognised values map to `0`.
 *
 * @param category - The string category
 * @returns The corresponding integer icon category code
 *
 * @ignore
 */
export const trafficIncidentToIconCategory = (category: TrafficIncidentCategory): number =>
    categoryToIconMap[category] ?? 0;
