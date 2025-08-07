import type { TrafficSectionProps } from '@anw/maps-sdk-js/core';
import { describe, expect, test } from 'vitest';
import type { DisplayTrafficSectionProps } from '../../types/routeSections';
import { toDisplayTrafficSectionProps, trafficSectionToIconID } from '../displayTrafficSectionProps';
import toDisplayTrafficSectionPropsData from './data/toDisplayTrafficSectionProps.data.json';
import toIconIdTestData from './data/toIconID.data.json';

describe('Traffic section builder tests', () => {
    test.each(toIconIdTestData)(
        "'%s'",
        // @ts-ignore
        (_name: string, sectionProps: TrafficSectionProps, expectedIconId: string) => {
            expect(trafficSectionToIconID(sectionProps)).toStrictEqual(expectedIconId);
        },
    );

    test.each(toDisplayTrafficSectionPropsData)(
        "'%s'",
        // @ts-ignore
        (_name: string, sectionProps: TrafficSectionProps, expectedDisplaySectionProps: DisplayTrafficSectionProps) => {
            expect(toDisplayTrafficSectionProps(sectionProps)).toStrictEqual(expectedDisplaySectionProps);
        },
    );
});
