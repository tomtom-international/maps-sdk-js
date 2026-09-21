import { readFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { mergeFromGlobal, TomTomConfig } from '@tomtom-org/maps-sdk/core';
import type { StyleSpecification } from 'maplibre-gl';
import { afterEach, describe, expect, test } from 'vitest';
import { buildStyleInput, DEFAULT_STYLE_VERSION, withPreviousStyleParts } from '../styleInputBuilder';
import type { TomTomMapParams } from '../types/mapInit';
import mapsSdkInitParamsAndMapStyles from './styleInputBuilder.data';

describe('Map style input builder tests', () => {
    test.each(mapsSdkInitParamsAndMapStyles)(
        `'%s`,
        (_name: string, tomtomMapParams: TomTomMapParams, rendererStyle: StyleSpecification | string) => {
            expect(buildStyleInput(mergeFromGlobal(tomtomMapParams))).toEqual(rendererStyle);
        },
    );

    describe('proxy mode (empty apiKey)', () => {
        afterEach(() => {
            TomTomConfig.instance.put({ apiKey: '', commonBaseURL: 'https://api.tomtom.com' });
        });

        test('omits key= from standard-style URL when apiKey is empty', () => {
            const styleUrl = buildStyleInput(mergeFromGlobal({ apiKey: '' } as TomTomMapParams)) as string;
            const parsed = new URL(styleUrl);
            expect(parsed.searchParams.has('key')).toBe(false);
            expect(parsed.searchParams.get('apiVersion')).toBe('1');
            expect(parsed.searchParams.get('map')).toBe('basic_street-light');
        });

        test('omits key= from custom-style URL when apiKey is empty', () => {
            const styleUrl = buildStyleInput(
                mergeFromGlobal({
                    apiKey: '',
                    style: { type: 'custom', url: 'https://example.com/custom-style.json' },
                } as TomTomMapParams),
            ) as string;
            expect(new URL(styleUrl).searchParams.has('key')).toBe(false);
        });
    });

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

// The fixture-refresh script regenerates what the styling version-guard tests run against, so it
// has to fetch the same version the SDK pins. It runs under plain `node`, which cannot resolve the
// SDK's extensionless imports, so it reads the pin out of this module's source rather than holding a
// copy. That read is what this test protects: reshape the declaration and the script stops finding
// it, at the one moment it is ever run — a style bump.
describe('the pinned style version', () => {
    test('is readable from source the way the fixture-refresh script reads it', () => {
        const sourcePath = fileURLToPath(new URL('../styleInputBuilder.ts', import.meta.url));
        const declared = /DEFAULT_STYLE_VERSION = '([^']+)'/.exec(readFileSync(sourcePath, 'utf8'))?.[1];
        expect(declared, `No DEFAULT_STYLE_VERSION declaration found in ${sourcePath}`).toBe(DEFAULT_STYLE_VERSION);
    });
});
