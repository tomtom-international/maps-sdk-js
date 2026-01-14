import { mergeFromGlobal } from '@tomtom-org/maps-sdk/core';
import type { MapOptions } from 'maplibre-gl';
import { describe, expect, test } from 'vitest';
import { buildMapOptions } from '../buildMapOptions';
import type { TomTomMapParams } from '../types/mapInit';
import sdkAndRendererInitParams from './buildMapOptions.data';

describe('Renderer init params tests', () => {
    test.each(
        sdkAndRendererInitParams,
    )(`'%s`, (_name: string, tomtomMapParams: TomTomMapParams, rendererOptions: MapOptions) => {
        const mergedOptions = mergeFromGlobal(tomtomMapParams);
        expect(buildMapOptions(mergedOptions)).toEqual({
            ...rendererOptions,
            transformRequest: expect.any(Function),
        });
    });
});
