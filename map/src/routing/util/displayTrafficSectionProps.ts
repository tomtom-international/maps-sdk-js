import type { DelayMagnitude, TrafficSectionProps } from "@anw/maps-sdk-js/core";
import { formatDuration } from "@anw/maps-sdk-js/core";
import type { DisplayTrafficSectionProps } from "../types/routeSections";

const delayMagnitudeToIconPrefix: Record<DelayMagnitude, string> = {
    unknown: "traffic_no_delay",
    minor: "traffic_slow",
    moderate: "traffic_queueing",
    major: "traffic_stationary",
    indefinite: "traffic_no_delay"
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
export const trafficSectionToIconID = (sectionProps: TrafficSectionProps): string | null => {
    const tecCauseCode = sectionProps.tec.causes?.[0].mainCauseCode;
    const tecIconSuffix = tecCauseCode && tecCauseToIconSuffix[tecCauseCode];
    if (!tecIconSuffix) {
        return null;
    }
    const magnitudePrefix =
        // ("traffic_road_closed" is an exception)
        tecIconSuffix === "road_closed"
            ? "traffic"
            : delayMagnitudeToIconPrefix[sectionProps.magnitudeOfDelay || "unknown"];
    return `${magnitudePrefix}_${tecIconSuffix}`;
};

/**
 * @ignore
 */
export const toDisplayTrafficSectionProps = (
    sectionProps: TrafficSectionProps
): Omit<DisplayTrafficSectionProps, "routeStyle" | "routeIndex"> => {
    const title = formatDuration(sectionProps.delayInSeconds);
    const iconID = trafficSectionToIconID(sectionProps);
    return {
        ...sectionProps,
        ...(iconID && { iconID }),
        ...(title && { title })
    };
};
