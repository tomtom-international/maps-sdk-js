import { describe, expect, test } from 'vitest';
import { buildConnectionLayerSpecs } from '../connectionsLayers';

describe('buildConnectionLayerSpecs', () => {
    test('resolves the line, label and halo colours for the active map theme', () => {
        const light = buildConnectionLayerSpecs(undefined, undefined, 'light');
        expect(light.line.paint).toMatchObject({ 'line-color': '#3f9cd9' });
        expect(light.label.paint).toMatchObject({ 'text-color': '#1a5f8a', 'text-halo-color': '#ffffff' });

        const dark = buildConnectionLayerSpecs(undefined, undefined, 'dark');
        expect(dark.line.paint).toMatchObject({ 'line-color': '#5AB6F0' });
        expect(dark.label.paint).toMatchObject({ 'text-color': '#A9D6F5', 'text-halo-color': '#1a1a1a' });
    });

    test('a published accent colour wins over the theme colours for the line and label', () => {
        const specs = buildConnectionLayerSpecs(undefined, '#FF5733', 'dark');

        expect(specs.line.paint).toMatchObject({ 'line-color': '#FF5733' });
        expect(specs.label.paint).toMatchObject({ 'text-color': '#FF5733', 'text-halo-color': '#1a1a1a' });
    });
});
