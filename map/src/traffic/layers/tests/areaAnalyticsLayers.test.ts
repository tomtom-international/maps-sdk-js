import { describe, expect, test } from 'vitest';
import { buildRegionFillLayerSpec, buildRegionLineLayerSpec } from '../areaAnalyticsLayers';

describe('region boundary layer specs', () => {
    test('resolve the boundary colour for the active map theme when the config omits it', () => {
        expect(buildRegionFillLayerSpec('region-fill', undefined, 'light').paint).toMatchObject({
            'fill-color': '#000000',
        });
        expect(buildRegionLineLayerSpec('region-line', undefined, 'light').paint).toMatchObject({
            'line-color': '#000000',
        });

        expect(buildRegionFillLayerSpec('region-fill', undefined, 'dark').paint).toMatchObject({
            'fill-color': '#FFFFFF',
        });
        expect(buildRegionLineLayerSpec('region-line', undefined, 'dark').paint).toMatchObject({
            'line-color': '#FFFFFF',
        });
    });

    test('an explicit config colour wins over the theme default', () => {
        const config = { regionPolygon: { color: '#FF5733' } };

        expect(buildRegionFillLayerSpec('region-fill', config, 'dark').paint).toMatchObject({
            'fill-color': '#FF5733',
        });
        expect(buildRegionLineLayerSpec('region-line', config, 'dark').paint).toMatchObject({
            'line-color': '#FF5733',
        });
    });
});
