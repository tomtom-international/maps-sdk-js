import { formatDuration, type TrafficSectionProps } from '@tomtom-org/maps-sdk/core';
import { incidentIconID } from '../../traffic/util/trafficIncidentStyle';
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
    return firstNonJamCategory ? incidentIconID(firstNonJamCategory) : null;
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
