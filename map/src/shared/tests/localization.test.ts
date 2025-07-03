import type { LayerSpecification, SymbolLayerSpecification } from 'maplibre-gl';
import { isLayerLocalizable } from '../localization';
import { layers } from './localization.data';

describe('test isLayerLocalizable function', () => {
    const symbolLayers = layers.filter((layerObj) => (layerObj[1] as LayerSpecification).type === 'symbol');
    //@ts-ignore
    test.each(symbolLayers)("'%s'", (_name: string, input: SymbolLayerSpecification, output: boolean) => {
        expect(isLayerLocalizable(input)).toBe(output);
    });
});
