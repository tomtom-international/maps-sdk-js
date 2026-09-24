import type { StylingCatalogue, StylingSettings } from '@tomtom-org/maps-sdk/map';
import { describe, expect, it, vi } from 'vitest';
import { makeMockState } from '../../../tests/constants';
import { executeDescribeMapStyling } from '../describe-map-styling';
import { executeSetMapStyling } from '../set-map-styling';

// A StylingModule stand-in with just the surface the two tools use.
const makeStylingMock = (catalogue: StylingCatalogue) => {
    let settings: StylingSettings | undefined;
    return {
        describe: vi.fn(() => catalogue),
        set: vi.fn((id: string, value: unknown) => {
            if (id === 'roads.widthFactor' && typeof value === 'number' && value > 1.5) {
                throw new RangeError(`Knob '${id}' expects a number between 0.5 and 1.5; got ${value}.`);
            }
            settings = { ...settings, [id]: value };
        }),
        reset: vi.fn((id?: string) => {
            if (id === undefined) settings = undefined;
            else if (settings) delete settings[id as keyof StylingSettings];
        }),
        getConfig: vi.fn(() => settings && { ...settings }),
        applyPreset: vi.fn((id: string) => {
            settings = id === 'globe' ? { 'view.projection': 'globe', 'view.sky': true } : {};
        }),
    };
};

const catalogue: StylingCatalogue = {
    presets: [
        {
            id: 'globe',
            name: 'Globe',
            description: 'A globe with an atmosphere.',
            settings: { 'view.projection': 'globe', 'view.sky': true },
        },
    ],
    knobs: [
        {
            id: 'labels.sizeFactor',
            kind: 'factor',
            description: 'Label size.',
            default: 1,
            current: 1,
            overridden: false,
            range: { min: 0.5, max: 1.5, step: 0.1 },
            available: true,
            appliesTo: 'any-style',
        },
        {
            id: 'roads.exitNumbers',
            kind: 'toggle',
            description: 'Exit numbers.',
            default: true,
            current: false,
            overridden: true,
            available: true,
            appliesTo: 'tomtom-styles',
        },
    ],
};

const stateWithStyling = (styling: ReturnType<typeof makeStylingMock>) => {
    const state = makeMockState();
    (state.baseMap as unknown as { getStylingModule: () => Promise<unknown> }).getStylingModule = async () => styling;
    return state;
};

describe('executeDescribeMapStyling', () => {
    it('returns the catalogue, optionally narrowed by kind', async () => {
        const state = stateWithStyling(makeStylingMock(catalogue));

        const all = await executeDescribeMapStyling({}, state);
        if ('error' in all) expect.fail('expected the catalogue');
        expect(all.knobs.map((knob) => knob.id)).toEqual(['labels.sizeFactor', 'roads.exitNumbers']);

        const toggles = await executeDescribeMapStyling({ kind: 'toggle' }, state);
        if ('error' in toggles) expect.fail('expected the catalogue');
        expect(toggles.knobs.map((knob) => knob.id)).toEqual(['roads.exitNumbers']);
    });

    it('reports a failure to get the module as a tool error', async () => {
        const state = makeMockState();
        (state.baseMap as unknown as { getStylingModule: () => Promise<unknown> }).getStylingModule = async () => {
            throw new Error('no style loaded');
        };
        expect(await executeDescribeMapStyling({}, state)).toEqual({
            error: 'Failed to describe map styling: no style loaded',
        });
    });
});

describe('executeSetMapStyling', () => {
    it('applies every valid knob and reports the ones the module refused', async () => {
        const styling = makeStylingMock(catalogue);
        const result = await executeSetMapStyling(
            { set: { 'labels.sizeFactor': 1.3, 'roads.exitNumbers': false, 'roads.widthFactor': 3 } },
            stateWithStyling(styling),
        );
        if ('error' in result) expect.fail('expected a result');

        expect(styling.set).toHaveBeenCalledWith('labels.sizeFactor', 1.3);
        expect(styling.set).toHaveBeenCalledWith('roads.exitNumbers', false);
        expect(result.settings).toEqual({ 'labels.sizeFactor': 1.3, 'roads.exitNumbers': false });
        expect(result.rejected).toEqual([
            {
                id: 'roads.widthFactor',
                reason: "Knob 'roads.widthFactor' expects a number between 0.5 and 1.5; got 3.",
            },
        ]);
    });

    it('resets before setting: everything, or just the listed knobs', async () => {
        const styling = makeStylingMock(catalogue);
        const state = stateWithStyling(styling);
        await executeSetMapStyling({ set: { 'labels.sizeFactor': 1.3, 'roads.exitNumbers': false } }, state);

        const partial = await executeSetMapStyling({ reset: ['roads.exitNumbers'] }, state);
        if ('error' in partial) expect.fail('expected a result');
        expect(styling.reset).toHaveBeenCalledWith('roads.exitNumbers');
        expect(partial.settings).toEqual({ 'labels.sizeFactor': 1.3 });

        const all = await executeSetMapStyling({ reset: true, set: { 'buildings.3d': true } }, state);
        if ('error' in all) expect.fail('expected a result');
        expect(styling.reset).toHaveBeenCalledWith();
        expect(all.settings).toEqual({ 'buildings.3d': true });
    });

    it('applies a preset, with `set` layered on top', async () => {
        const styling = makeStylingMock(catalogue);
        const result = await executeSetMapStyling(
            { preset: 'globe', set: { 'labels.sizeFactor': 1.2 } },
            stateWithStyling(styling),
        );
        if ('error' in result) expect.fail('expected a result');
        expect(styling.applyPreset).toHaveBeenCalledWith('globe');
        expect(result.settings).toEqual({ 'view.projection': 'globe', 'view.sky': true, 'labels.sizeFactor': 1.2 });
    });
});
