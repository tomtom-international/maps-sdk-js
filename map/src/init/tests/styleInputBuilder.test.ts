import type { StyleSpecification } from 'maplibre-gl';
import { describe, expect, test } from 'vitest';
import { buildStyleInput, withPreviousStyleParts } from '../styleInputBuilder';
import type { TomTomMapParams } from '../types/mapInit';
import mapsSdkInitParamsAndMapStyles from './styleInputBuilder.data';

describe('Map style input builder tests', () => {
    test.each(mapsSdkInitParamsAndMapStyles)(
        `'%s`,
        (_name: string, tomtomMapParams: TomTomMapParams, rendererStyle: StyleSpecification | string) => {
            expect(buildStyleInput(tomtomMapParams)).toEqual(rendererStyle);
        },
    );

    test('With previous style parts test', () => {
        expect(withPreviousStyleParts('standardDark')).toBe('standardDark');
        expect(withPreviousStyleParts('standardDark', 'monoLight')).toBe('standardDark');
        expect(withPreviousStyleParts('standardDark', { type: 'standard', id: 'monoLight' })).toBe('standardDark');
        expect(
            withPreviousStyleParts({ type: 'standard', id: 'standardDark' }, { type: 'standard', id: 'monoLight' }),
        ).toEqual({ type: 'standard', id: 'standardDark' });
        expect(
            withPreviousStyleParts(
                { type: 'standard', id: 'standardDark' },
                { type: 'standard', id: 'monoLight', include: ['hillshade'] },
            ),
        ).toEqual({ type: 'standard', id: 'standardDark', include: ['hillshade'] });
        expect(
            withPreviousStyleParts(
                { type: 'standard', id: 'standardDark', include: ['trafficIncidents'] },
                { type: 'standard', id: 'monoLight', include: ['hillshade'] },
            ),
        ).toEqual({ type: 'standard', id: 'standardDark', include: ['trafficIncidents'] });
        // New style has no include section so it's taken from the previous one:
        expect(
            withPreviousStyleParts(
                { type: 'standard', id: 'standardDark' },
                { type: 'standard', id: 'monoLight', include: ['trafficIncidents'] },
            ),
        ).toEqual({ type: 'standard', id: 'standardDark', include: ['trafficIncidents'] });
    });
});
