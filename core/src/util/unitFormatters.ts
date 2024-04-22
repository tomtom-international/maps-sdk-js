import isNil from "lodash/isNil";
import type { DistanceDisplayUnits, TimeDisplayUnits } from "../config/globalConfig";
import { TomTomConfig } from "../config/globalConfig";

const minuteUnits = (displayUnits?: TimeDisplayUnits): string => displayUnits?.minutes ?? "min";
const hourUnits = (displayUnits?: TimeDisplayUnits): string => displayUnits?.hours ?? "hr";

/**
 * Returns a display-friendly version, in minutes and hours if needed, of the given duration in seconds.
 * * Examples:
 * ```ts
 * 0 -> null
 * 20 -> null
 * 30 -> 1 min
 * 60 -> 1 min
 * 100 -> 2 min
 * 3599 -> 1 hr
 * 3660 -> 1 hr 01 min
 * 36120 -> 10 hr 02 min
 * ```
 * @param seconds The duration to format, given in seconds.
 * @param options Optional parameters for the time display units.
 * @group Shared
 * @category Functions
 */
export const formatDuration = (seconds: number | undefined, options?: TimeDisplayUnits): string | undefined => {
    if (seconds) {
        // get the absolute value for seconds to calculate the right formatting
        const hours = Math.abs(seconds) / 3600;
        let flooredHours = Math.floor(hours);
        let minutes = Math.round((hours % 1) * 60);
        if (minutes === 60) {
            minutes = 0;
            flooredHours++;
        }
        options = { ...TomTomConfig.instance.get().displayUnits?.time, ...options };
        if (flooredHours) {
            // eslint-disable-next-line max-len
            return `${flooredHours} ${hourUnits(options)} ${minutes.toString().padStart(2, "0")} ${minuteUnits(options)}`;
        } else if (minutes) {
            return `${minutes.toString()} ${minuteUnits(options)}`;
        }
    }
    return undefined;
};

/**
 * Types of distance units SDK formatters work with.
 * @group Shared
 * @category Types
 */
export type DistanceUnitsType = "metric" | "imperial_us" | "imperial_uk";

const MILE_IN_METERS = 1609.344;
const FEET_IN_METERS = 0.3048;
const YARD_IN_METERS = 0.9144;

const meterUnits = (displayUnits?: DistanceDisplayUnits): string => displayUnits?.meters ?? "m";
const kmUnits = (displayUnits?: DistanceDisplayUnits): string => displayUnits?.kilometers ?? "km";

const formatMetric = (meters: number, displayUnits: DistanceDisplayUnits): string => {
    const absMeters = Math.abs(meters);
    if (absMeters < 10) {
        return `${meters} ${meterUnits(displayUnits)}`;
    } else if (absMeters < 500) {
        return `${Math.round(meters / 10) * 10} ${meterUnits(displayUnits)}`;
    } else if (absMeters < 1000) {
        const roundedMeters = Math.round(meters / 100) * 100;
        return roundedMeters === 1000 || roundedMeters === -1000
            ? `${meters < 0 ? "-" : ""}1 ${kmUnits(displayUnits)}`
            : `${roundedMeters} ${meterUnits(displayUnits)}`;
    } else if (absMeters < 10000) {
        return `${(Math.round(meters / 100) * 100) / 1000} ${kmUnits(displayUnits)}`;
    } else {
        return `${Math.round(meters / 1000)} ${kmUnits(displayUnits)}`;
    }
};

const formatFeet = (meters: number, feetUnits: string): string => {
    const feet = Math.round(meters / FEET_IN_METERS);
    const absFeet = Math.abs(feet);
    if (absFeet < 30) {
        return `${feet} ${feetUnits}`;
    } else if (absFeet < 500) {
        return `${Math.round(feet / 10) * 10} ${feetUnits}`;
    } else {
        return `${Math.round(feet / 100) * 100} ${feetUnits}`;
    }
};

const formatYards = (meters: number, yardUnits: string): string => {
    const yards = Math.round(meters / YARD_IN_METERS);
    if (Math.abs(yards) < 10) {
        return `${Math.round(yards)} ${yardUnits}`;
    } else {
        return `${Math.round(yards / 10) * 10} ${yardUnits}`;
    }
};

const formatUSMilesLessThanThree = (miles: number, absMiles: number, mileUnits: string): string => {
    const milesInteger = parseInt(absMiles.toString());
    const milesFloat = absMiles - milesInteger;
    const sign = miles < 0 ? "-" : "";
    if (milesFloat < 0.125) {
        return `${sign}${milesInteger} ${mileUnits}`;
    } else {
        const showIntegerIfNotZero = milesInteger > 0 ? milesInteger : "";
        if (milesFloat < 0.375) {
            return `${sign}${showIntegerIfNotZero}¼ ${mileUnits}`;
        } else if (milesFloat < 0.625) {
            return `${sign}${showIntegerIfNotZero}½ ${mileUnits}`;
        } else if (milesFloat < 0.875) {
            return `${sign}${showIntegerIfNotZero}¾ ${mileUnits}`;
        } else {
            return `${sign}${milesInteger + 1} ${mileUnits}`;
        }
    }
};

const formatUSMilesLessThanTen = (miles: number, absMiles: number, mileUnits: string): string => {
    const milesInteger = parseInt(absMiles.toString());
    const milesFloat = absMiles - milesInteger;
    const sign = miles < 0 ? "-" : "";
    if (milesFloat < 0.25) {
        return `${sign}${milesInteger} ${mileUnits}`;
    } else if (milesFloat < 0.75) {
        return `${sign}${milesInteger}½ ${mileUnits}`;
    } else {
        return `${sign}${milesInteger + 1} ${mileUnits}`;
    }
};

const formatMiles = (miles: number, absMiles: number, mileUnits: string): string => {
    if (absMiles < 3) {
        return formatUSMilesLessThanThree(miles, absMiles, mileUnits);
    } else if (absMiles < 10) {
        return formatUSMilesLessThanTen(miles, absMiles, mileUnits);
    } else {
        return `${Math.round(miles)} ${mileUnits}`;
    }
};

const mileUnitsWithDefault = (displayUnits: DistanceDisplayUnits): string => displayUnits.miles ?? "mi";

const formatUS = (meters: number, displayUnits: DistanceDisplayUnits): string => {
    const miles = meters / MILE_IN_METERS;
    const absMiles = Math.abs(miles);
    if (absMiles < 0.125) {
        return formatFeet(meters, displayUnits.feet ?? "ft");
    } else {
        return formatMiles(miles, absMiles, mileUnitsWithDefault(displayUnits));
    }
};

const formatUK = (meters: number, displayUnits: DistanceDisplayUnits): string => {
    const miles = meters / MILE_IN_METERS;
    const absMiles = Math.abs(miles);
    if (absMiles < 0.125) {
        return formatYards(meters, displayUnits.yards ?? "yd");
    } else {
        return formatMiles(miles, absMiles, mileUnitsWithDefault(displayUnits));
    }
};

/**
 * Formatting is based on the number of meters passed and unit type. Less meters more precision.
 * * Examples:
 * ```ts
 * (null, METRIC) -> ""
 * (0, METRIC) -> "0 m"
 * (2, METRIC) -> "2 m"
 * (237, METRIC) -> "240 m"
 * (730, METRIC) -> "700 m"
 * (950, METRIC) -> "1 km"
 * (-999, METRIC) -> "-1 km"
 * (2850, METRIC) -> "2.9 km"
 * (283520, METRIC) -> "284 km"
 * (2, IMPERIAL_US) -> "7 ft"
 * (100, IMPERIAL_US) -> "330 ft"
 * (182.88, IMPERIAL_US) -> "600 ft"
 * (205.95, IMPERIAL_US) -> "¼ mi"
 * (1205.95, IMPERIAL_US) -> "¾ mi"
 * (5309.7, IMPERIAL_US) -> "3½ mi"
 * (-18181.7, IMPERIAL_US) -> "-11 mi"
 * (2, IMPERIAL_UK) -> "2 yd"
 * (150.88, IMPERIAL_UK) -> "170 yd"
 * (4344.3, IMPERIAL_UK) -> "2¾ mi"
 * (21753.68, IMPERIAL_UK) -> "14 mi"
 * ```
 * @param meters
 * @param options Options for the display units, including their type and custom ways to display them.
 * @group Shared
 * @category Functions
 */
export const formatDistance = (meters: number, options?: DistanceDisplayUnits): string => {
    if (isNil(meters)) {
        return "";
    }
    options = { ...TomTomConfig.instance.get().displayUnits?.distance, ...options };
    const unitsType = options?.type ?? "metric";
    switch (unitsType) {
        case "metric":
            return formatMetric(meters, options);
        case "imperial_us":
            return formatUS(meters, options);
        case "imperial_uk":
            return formatUK(meters, options);
    }
};
