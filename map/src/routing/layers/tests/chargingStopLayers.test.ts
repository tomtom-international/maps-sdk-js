import { describe, expect, test } from 'vitest';
import { ICON_ID } from '../../../shared/layers/symbolLayers';
import type { ChargingStopsConfig } from '../../types/routeModuleConfig';
import { chargingStopSymbol } from '../chargingStopLayers';

describe('chargingStopSymbol', () => {
    test('leaves icon-offset off the layout when there is no config', () => {
        expect(chargingStopSymbol(undefined).layout).not.toHaveProperty('icon-offset');
    });

    test('leaves icon-offset off the layout when no custom icon sets an offset', () => {
        const config: ChargingStopsConfig = {
            icon: { customIcons: [{ id: 'fast-charger', image: '<svg />' }] },
        };

        expect(chargingStopSymbol(config).layout).not.toHaveProperty('icon-offset');
    });

    test('matches the offset on the unsuffixed icon id', () => {
        const config: ChargingStopsConfig = {
            icon: { customIcons: [{ id: 'fast-charger', image: '<svg />', offsetX: 0, offsetY: -12 }] },
        };

        expect(chargingStopSymbol(config).layout?.['icon-offset']).toEqual([
            'case',
            ['==', ['get', ICON_ID], 'fast-charger'],
            ['literal', [0, -12]],
            ['literal', [0, 0]],
        ]);
    });

    test('offsets only the icons that ask for it', () => {
        const config: ChargingStopsConfig = {
            icon: {
                customIcons: [
                    { id: 'slow-charger', image: '<svg />' },
                    { id: 'fast-charger', image: '<svg />', offsetY: -12 },
                ],
            },
        };

        expect(chargingStopSymbol(config).layout?.['icon-offset']).toEqual([
            'case',
            ['==', ['get', ICON_ID], 'fast-charger'],
            ['literal', [0, -12]],
            ['literal', [0, 0]],
        ]);
    });

    test('keeps the icon-image binding the offset expression matches against', () => {
        const config: ChargingStopsConfig = {
            icon: { customIcons: [{ id: 'fast-charger', image: '<svg />', offsetY: -12 }] },
        };

        expect(chargingStopSymbol(config).layout?.['icon-image']).toEqual(['get', ICON_ID]);
    });

    test('still applies the configured text field alongside an offset', () => {
        const config: ChargingStopsConfig = {
            text: { title: ['get', 'chargingDuration'] },
            icon: { customIcons: [{ id: 'fast-charger', image: '<svg />', offsetY: -12 }] },
        };

        const layout = chargingStopSymbol(config).layout;

        expect(layout?.['text-field']).toEqual(['get', 'chargingDuration']);
        expect(layout).toHaveProperty('icon-offset');
    });
});
