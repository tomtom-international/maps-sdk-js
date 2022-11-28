import { TrafficSectionProps } from "@anw/go-sdk-js/core";
import { DisplayTrafficSectionProps } from "../types/RouteSections";
import { formatDuration } from "../../core";

const delayMagnitudeToIconPrefix = {
    MINOR: "traffic_slow",
    MODERATE: "traffic_queueing",
    MAJOR: "traffic_stationary",
    UNKNOWN: "traffic_no_delay",
    UNDEFINED: "traffic_no_delay"
};

const tecCauseToIconSuffix: Record<number, string> = {
    1: "jam",
    2: "accident",
    3: "roadworks",
    5: "road_closed",
    9: "danger",
    16: "lane_closed",
    17: "weather_wind",
    18: "weather_fog",
    19: "weather_rain"
};

/**
 * @ignore
 */
export const trafficSectionToIconID = (sectionProps: TrafficSectionProps): string => {
    const tecCauseCode = sectionProps.tec.causes[0].mainCauseCode;
    const magnitudePrefix =
        // ("traffic_road_closed" is an exception)
        tecCauseToIconSuffix[tecCauseCode] === "road_closed"
            ? "traffic"
            : delayMagnitudeToIconPrefix[sectionProps.magnitudeOfDelay || "UNKNOWN"];
    return `${magnitudePrefix}_${tecCauseToIconSuffix[tecCauseCode]}`;
};

/**
 * @ignore
 */
export const toDisplayTrafficSectionProps = (section: TrafficSectionProps): DisplayTrafficSectionProps => {
    const title = formatDuration(section.delayInSeconds);
    return {
        ...section,
        iconID: trafficSectionToIconID(section),
        ...(title && { title })
    };
};
