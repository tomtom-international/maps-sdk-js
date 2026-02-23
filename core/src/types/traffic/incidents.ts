/**
 * Severity of the traffic delay.
 *
 * @remarks
 * - `unknown`: Delay magnitude cannot be determined
 * - `minor`: Small delay (few minutes)
 * - `moderate`: Noticeable delay (several minutes to ~10 minutes)
 * - `major`: Significant delay (10+ minutes)
 * - `indefinite`: Unknown or extremely long delay (e.g., road closure)
 *
 * @group Traffic
 */
export type DelayMagnitude = 'unknown' | 'minor' | 'moderate' | 'major' | 'indefinite';

/**
 * All possible traffic incident categories.
 * @group Traffic
 */
export const trafficIncidentCategories = [
    'accident',
    'animals-on-road',
    'broken-down-vehicle',
    'danger',
    'flooding',
    'fog',
    'frost',
    'jam',
    'lane-closed',
    'narrow-lanes',
    'other',
    'rain',
    'road-closed',
    'roadworks',
    'wind',
] as const;

/**
 * Simple category classification for traffic incidents.
 *
 * @remarks
 * - `accident`: Traffic accident or collision
 * - `animals-on-road`: Animals present on the road
 * - `broken-down-vehicle`: Vehicle breakdown causing obstruction
 * - `danger`: Dangerous situation on the road
 * - `flooding`: Flooded road section
 * - `fog`: Fog reducing visibility
 * - `frost`: Frost or ice on the road
 * - `jam`: Traffic congestion or slow-moving traffic
 * - `lane-closed`: One or more lanes closed
 * - `narrow-lanes`: Lane narrowing reducing road capacity
 * - `other`: Other types of incidents
 * - `rain`: Heavy rain affecting driving conditions
 * - `road-closed`: Road is closed or blocked
 * - `roadworks`: Construction or maintenance work
 * - `wind`: Strong wind conditions affecting traffic
 *
 * @group Traffic
 */
export type TrafficIncidentCategory = (typeof trafficIncidentCategories)[number];
