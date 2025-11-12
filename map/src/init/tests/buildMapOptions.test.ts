import type { MapOptions } from 'maplibre-gl';
import { describe, expect, test } from 'vitest';
import { buildMapOptions } from '../buildMapOptions';
import type { MapLibreOptions, TomTomMapParams } from '../types/mapInit';
import sdkAndRendererInitParams from './buildMapOptions.data';

describe('Renderer init params tests', () => {
    test.each(sdkAndRendererInitParams)(
        `'%s`,
        (
            _name: string,
            mapLibreOptions: MapLibreOptions,
            tomtomMapParams: TomTomMapParams,
            rendererOptions: MapOptions,
        ) => {
            expect(buildMapOptions(mapLibreOptions, tomtomMapParams)).toEqual({
                ...rendererOptions,
                transformRequest: expect.any(Function),
            });
        },
    );
});
