import type { TrafficSectionProps } from '@tomtom-org/maps-sdk/core';
import { describe, expect, test } from 'vitest';
import type { DisplayTrafficSectionProps } from '../../types/routeSections';
import { toDisplayTrafficSectionProps } from '../displayTrafficSectionProps';
import { toDisplayTrafficSectionPropsData } from './data/toDisplayTrafficSectionProps.data';

describe('Traffic section builder tests', () => {
    test.each(
        toDisplayTrafficSectionPropsData,
    )('%s', (_name: string, sectionProps: TrafficSectionProps, expectedDisplaySectionProps: Omit<
        DisplayTrafficSectionProps,
        'routeState' | 'routeIndex'
    >) => {
        expect(toDisplayTrafficSectionProps(sectionProps)).toStrictEqual(expectedDisplaySectionProps);
    });
});
