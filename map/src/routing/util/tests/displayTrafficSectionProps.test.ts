import type { TrafficSectionProps } from '@tomtom-org/maps-sdk/core';
import { describe, expect, test } from 'vitest';
import type { DisplayTrafficSectionProps } from '../../types/routeSections';
import { toDisplayTrafficSectionProps } from '../displayTrafficSectionProps';
import toDisplayTrafficSectionPropsData from './data/toDisplayTrafficSectionProps.data.json';

describe('Traffic section builder tests', () => {
    test.each(toDisplayTrafficSectionPropsData)(
        "'%s'",
        // @ts-ignore
        (_name: string, sectionProps: TrafficSectionProps, expectedDisplaySectionProps: DisplayTrafficSectionProps) => {
            expect(toDisplayTrafficSectionProps(sectionProps)).toStrictEqual(expectedDisplaySectionProps);
        },
    );
});
