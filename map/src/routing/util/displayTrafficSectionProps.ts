import type { TrafficSectionProps } from '@tomtom-org/maps-sdk/core';
import { formatDuration } from '@tomtom-org/maps-sdk/core';
import type { DisplayTrafficSectionProps } from '../types/routeSections';

const hasJam = (sectionProps: TrafficSectionProps): boolean => sectionProps.categories.includes('jam');

const buildTitle = (sectionProps: TrafficSectionProps): string | undefined => {
    if (hasJam(sectionProps)) {
        return formatDuration(sectionProps.delayInSeconds);
    }
    return undefined;
};

const toTrafficJamIconSuffix = (title: string | undefined): 'collapsed' | 'small' | 'medium' | 'large' => {
    if (!title?.length) {
        return 'collapsed';
    }
    if (title.length < 6) {
        // 1 digit minutes
        return 'small';
    }
    if (title.length < 8) {
        // 2 digit minutes
        return 'medium';
    }
    // hours + minutes
    return 'large';
};

const toJamIconID = (sectionProps: TrafficSectionProps, title: string | undefined): string | null => {
    if (!hasJam(sectionProps)) {
        return null;
    }
    const magnitude = sectionProps.magnitudeOfDelay ?? 'unknown';
    return `traffic-jam-${magnitude}-${toTrafficJamIconSuffix(title)}`;
};

const toCauseIconID = (sectionProps: TrafficSectionProps): string | null => {
    const firstNonJamCategory = sectionProps.categories.find((category) => category !== 'jam');
    switch (firstNonJamCategory) {
        case 'accident':
            return 'traffic-incidents-accident';
        case 'roadworks':
            return 'traffic-incidents-roadworks';
        case 'road-closed':
            return 'traffic-incidents-road_closed';
        case 'danger':
        case 'animals-on-road':
            return 'traffic-incidents-danger';
        case 'broken-down-vehicle':
            return 'traffic-incidents-broken_down_vehicle';
        case 'lane-closed':
        case 'narrow-lanes':
            return 'traffic-incidents-lane_closed';
        case 'wind':
            return 'traffic-incidents-wind';
        case 'fog':
            return 'traffic-incidents-fog';
        case 'rain':
            return 'traffic-incidents-rain';
        case 'frost':
            return 'traffic-incidents-frost';
        case 'flooding':
            return 'traffic-incidents-flooding';
        default:
            return null;
    }
};

/**
 * @ignore
 */
export const toDisplayTrafficSectionProps = (
    sectionProps: TrafficSectionProps,
): Omit<DisplayTrafficSectionProps, 'routeState' | 'routeIndex'> => {
    const title = buildTitle(sectionProps);
    const jamIconID = toJamIconID(sectionProps, title);
    const causeIconID = toCauseIconID(sectionProps);
    return {
        ...sectionProps,
        ...(jamIconID && { jamIconID }),
        ...(causeIconID && { causeIconID }),
        ...(title && { title }),
    };
};
