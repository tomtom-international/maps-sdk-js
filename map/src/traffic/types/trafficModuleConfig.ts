import { DelayMagnitude } from "@anw/maps-sdk-js/core";
import { FilterShowMode, ValuesFilter, StyleModuleConfig } from "../../shared";

/**
 * Available incident categories.
 */
export const incidentCategories = [
    "unknown",
    "accident",
    "fog",
    "dangerous_conditions",
    "rain",
    "ice",
    "jam",
    "lane_closed",
    "road_closed",
    "road_works",
    "wind",
    "flooding",
    "broken_down_vehicle"
] as const;

/**
 * Available incident categories.
 */
export type IncidentCategory = (typeof incidentCategories)[number];

/**
 * @ignore
 */
export const incidentCategoriesMapping: Record<IncidentCategory, number> = {
    unknown: 0,
    accident: 1,
    fog: 2,
    dangerous_conditions: 3,
    rain: 4,
    ice: 5,
    jam: 6,
    lane_closed: 7,
    road_closed: 8,
    road_works: 9,
    wind: 10,
    flooding: 11,
    broken_down_vehicle: 14
} as const;

/**
 * Available road categories.
 */
export const roadCategories = ["motorway", "trunk", "primary", "secondary", "tertiary", "street"] as const;

/**
 * Available road categories.
 */
export type RoadCategory = (typeof roadCategories)[number];

/**
 * Available tertiary road sub-categories.
 */
export const tertiaryRoadCategories = ["connecting", "major_local"] as const;
/**
 * Available tertiary road sub-categories.
 */
export type TertiaryRoadCategory = (typeof tertiaryRoadCategories)[number];

/**
 * Available street road sub-categories.
 */
export const streetRoadCategories = ["local", "minor_local"] as const;
/**
 * Available street road sub-categories.
 */
export type StreetRoadCategory = (typeof streetRoadCategories)[number];

export type DelayFilter = {
    /**
     * Whether incidents must include a delay. If true, any incidents without a delay will be hidden.
     * @default false
     */
    mustHaveDelay?: boolean;
    /**
     * The minimum delay in minutes.
     * * If mustHaveDelay is false or not set, this rule only applies to incidents that have a delay.
     */
    minDelayMinutes?: number;
};

/**
 * Common configuration type to incidents and flow filters.
 */
export type TrafficCommonFilter = {
    /**
     * What road categories to show or hide.
     */
    roadCategories?: ValuesFilter<RoadCategory>;
    /**
     * What road sub-categories to show or hide.
     */
    roadSubCategories?: ValuesFilter<TertiaryRoadCategory | StreetRoadCategory>;
};

/**
 * Filter config for traffic incidents.
 */
export type TrafficIncidentsFilter = TrafficCommonFilter & {
    /**
     * What incident categories to show or hide.
     */
    incidentCategories?: ValuesFilter<IncidentCategory>;
    /**
     * What delay magnitudes to show or hide.
     */
    magnitudes?: ValuesFilter<DelayMagnitude>;
    /**
     * Delay filter configuration.
     */
    delays?: DelayFilter;
};

/**
 * Traffic incident filters, together with an "any" or "or" relationship.
 */
export type TrafficIncidentsFilters = {
    any: TrafficIncidentsFilter[];
};

/**
 * Traffic flow filter configuration.
 */
export type TrafficFlowFilter = TrafficCommonFilter & {
    /**
     * Whether to only show road closures, or show anything except road closures.
     */
    showRoadClosures?: FilterShowMode;
};

/**
 * Traffic flow filters, together with an "any" or "or" relationship.
 */
export type TrafficFlowFilters = {
    /**
     * Traffic flow filters, together with an "any" or "or" relationship.
     */
    any: TrafficFlowFilter[];
};

/**
 * Traffic incidents configuration.
 */
export type IncidentsConfig = IncidentsCommonConfig & {
    icons?: IncidentsCommonConfig;
};

/**
 * Common properties for traffic incident lines and icons.
 */
export type IncidentsCommonConfig = {
    visible?: boolean;
    filters?: TrafficIncidentsFilters;
};

/**
 * Traffic flow configuration.
 */
export type FlowConfig = {
    visible?: boolean;
    filters?: TrafficFlowFilters;
};

/**
 * Configuration for vector tiles traffic incidents and flow layers.
 */
export type TrafficModuleConfig = StyleModuleConfig & {
    /**
     * Optional configuration for incidents.
     */
    incidents?: IncidentsConfig;
    /**
     * Optional configuration for flow.
     */
    flow?: FlowConfig;
};
