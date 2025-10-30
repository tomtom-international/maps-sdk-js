import type { DelayMagnitude, TrafficSectionProps } from '@tomtom-org/maps-sdk-js/core';
import { formatDuration } from '@tomtom-org/maps-sdk-js/core';
import type { DisplayTrafficSectionProps } from '../types/routeSections';

const delayMagnitudeToIconPrefix: Record<DelayMagnitude, string> = {
    unknown: 'traffic-incidents-no_delay',
    minor: 'traffic-incidents-minor',
    moderate: 'traffic-incidents-moderate',
    major: 'traffic-incidents-major',
    indefinite: 'traffic-incidents-no_delay',
};

const tecCauseToIconSuffix: Record<number, string> = {
    1: 'jam',
    2: 'accident',
    3: 'roadworks',
    5: 'road_closed',
    9: 'danger',
    16: 'lane_closed',
    17: 'weather_wind',
    18: 'weather_fog',
    19: 'weather_rain',
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
        // ("traffic-incidents-road_closed" is an exception)
        tecIconSuffix === 'road_closed'
            ? 'traffic-incidents'
            : delayMagnitudeToIconPrefix[sectionProps.magnitudeOfDelay ?? 'unknown'];
    return `${magnitudePrefix}-${tecIconSuffix}`;
};

/**
 * @ignore
 */
export const toDisplayTrafficSectionProps = (
    sectionProps: TrafficSectionProps,
): Omit<DisplayTrafficSectionProps, 'routeState' | 'routeIndex'> => {
    const title = formatDuration(sectionProps.delayInSeconds);
    const iconId = trafficSectionToIconID(sectionProps);
    return {
        ...sectionProps,
        ...(iconId && { iconID: iconId }),
        ...(title && { title }),
    };
};
