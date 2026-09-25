import { describe, expect, test } from 'vitest';
import { collectColorLiterals, pickAnchorLiteral, recolorValue } from '../colorRewrite';

// The compiled `Surface - Motorway & Trunk` line-color: motorway and trunk shades inside a match on the
// road class, a restricted-access grey in a second match, and a transparent fallback.
const motorwayLineColor = [
    'interpolate',
    ['exponential', 1],
    ['zoom'],
    5,
    [
        'match',
        ['get', 'category'],
        'motorway',
        'hsl(47, 100%, 55%)',
        'trunk',
        'hsl(47, 92%, 63%)',
        'hsla(0, 0%, 100%, 0)',
    ],
    9,
    [
        'match',
        ['get', 'access'],
        'prohibited',
        'hsl(0, 0%, 91%)',
        [
            'match',
            ['get', 'category'],
            'motorway',
            'hsl(47, 100%, 70%)',
            'trunk',
            'hsl(47, 92%, 78%)',
            'hsla(0, 0%, 100%, 0)',
        ],
    ],
];

describe('collectColorLiterals', () => {
    test('finds every opaque literal with its road-class context, skipping transparent ones', () => {
        const literals = collectColorLiterals(motorwayLineColor);
        expect(literals).toStrictEqual([
            { literal: 'hsl(47, 100%, 55%)', roadClass: 'major' },
            { literal: 'hsl(47, 92%, 63%)', roadClass: 'major' },
            { literal: 'hsl(0, 0%, 91%)', roadClass: undefined },
            { literal: 'hsl(47, 100%, 70%)', roadClass: 'major' },
            { literal: 'hsl(47, 92%, 78%)', roadClass: 'major' },
        ]);
    });

    test('a match on the road class splits its branches; the fallback counts as minor', () => {
        const tunnel = [
            'match',
            ['get', 'category'],
            ['motorway', 'trunk'],
            '#111111',
            'secondary',
            '#222222',
            '#333333',
        ];
        expect(collectColorLiterals(tunnel).map((entry) => entry.roadClass)).toStrictEqual(['major', 'minor', 'minor']);
    });
});

describe('pickAnchorLiteral', () => {
    test('picks the most saturated literal the colour owns', () => {
        expect(pickAnchorLiteral(motorwayLineColor)).toBe('hsl(47, 100%, 55%)');
        // Water: the glacier wash loses to the water itself.
        const water = ['match', ['get', 'category'], 'glacier', 'hsl(196, 20%, 97%)', 'hsl(196, 71%, 73%)'];
        expect(pickAnchorLiteral(water)).toBe('hsl(196, 71%, 73%)');
        expect(pickAnchorLiteral('#abcdef')).toBe('#abcdef');
        expect(pickAnchorLiteral(['get', 'nothing'])).toBeUndefined();
    });
});

describe('recolorValue', () => {
    test('re-derives every owned literal from the new colour with the same HSL offset', () => {
        const recoloured = recolorValue(motorwayLineColor, [
            {
                anchorColor: 'hsl(47, 100%, 55%)',
                newColor: 'hsl(200, 100%, 55%)',
                owns: (roadClass) => roadClass === 'major',
            },
        ]);
        const literals = collectColorLiterals(recoloured).map((entry) => entry.literal);
        // Same hue as the new colour; trunk stays 8 points less saturated and 8 lighter than the motorway.
        expect(literals).toStrictEqual([
            'hsl(200, 100%, 55%)',
            'hsl(200, 92%, 63%)',
            'hsl(0, 0%, 91%)', // not a major-road literal: untouched
            'hsl(200, 100%, 70%)',
            'hsl(200, 92%, 78%)',
        ]);
        // Transparent fallbacks are kept, and the shape is intact.
        expect(JSON.stringify(recoloured)).toContain('hsla(0, 0%, 100%, 0)');
        expect((recoloured as unknown[])[0]).toBe('interpolate');
    });

    test('leaves tints of another hue family alone: a hospital pink is not a shade of the built-up beige', () => {
        const landuseFill = [
            'match',
            ['get', 'landuse'],
            'hospital',
            'hsl(340, 45%, 93%)',
            'shopping',
            'hsl(270, 30%, 92%)',
            'industrial',
            'hsl(40, 6%, 90%)', // a grey shade of the beige: re-derived
            'hsl(40, 12%, 94%)', // the built-up beige itself
        ];
        const recoloured = recolorValue(landuseFill, [
            { anchorColor: 'hsl(40, 12%, 94%)', newColor: 'hsl(210, 12%, 20%)' },
        ]);
        expect(collectColorLiterals(recoloured).map((entry) => entry.literal)).toStrictEqual([
            'hsl(340, 45%, 93%)',
            'hsl(270, 30%, 92%)',
            'hsl(210, 6%, 16%)',
            'hsl(210, 12%, 20%)',
        ]);
    });

    test('keeps the original alpha of a derived shade', () => {
        expect(recolorValue('hsla(0, 0%, 100%, 0.8)', [{ anchorColor: 'hsl(0, 0%, 100%)', newColor: '#000000' }])).toBe(
            'hsla(0, 0%, 0%, 0.8)',
        );
    });

    test('a legacy stops function keeps its shape', () => {
        const legacy = {
            stops: [
                [10, 'hsl(0, 100%, 51%)'],
                [15, 'hsl(0, 100%, 34%)'],
            ],
        };
        expect(
            recolorValue(legacy, [{ anchorColor: 'hsl(0, 100%, 51%)', newColor: 'hsl(120, 100%, 51%)' }]),
        ).toStrictEqual({
            stops: [
                [10, 'hsl(120, 100%, 51%)'],
                [15, 'hsl(120, 100%, 34%)'],
            ],
        });
    });

    test('two colours over one layer each take their own hue family', () => {
        // A bridge fill shading from the land beige at low zoom into the built-up blue at high.
        const bridgeFill = ['interpolate', ['linear'], ['zoom'], 6, 'hsl(45, 35%, 92%)', 13, 'hsl(210, 15%, 97%)'];
        const recoloured = recolorValue(bridgeFill, [
            { anchorColor: 'hsl(45, 35%, 92%)', newColor: 'hsl(0, 80%, 50%)' },
            { anchorColor: 'hsl(210, 25%, 93%)', newColor: 'hsl(120, 80%, 50%)' },
        ]);
        expect(collectColorLiterals(recoloured).map((entry) => entry.literal)).toStrictEqual([
            'hsl(0, 80%, 50%)',
            'hsl(120, 70%, 54%)',
        ]);
    });

    test('a literal both colours own is derived from the style, not from what the first one wrote', () => {
        // Two anchors in one hue family, as a theme whose land and built-up sit a few degrees apart
        // has: the last bid wins outright rather than re-deriving the first bid's output.
        const bids = [
            { anchorColor: 'hsl(45, 35%, 92%)', newColor: 'hsl(0, 80%, 50%)' },
            { anchorColor: 'hsl(38, 21%, 93%)', newColor: 'hsl(210, 60%, 40%)' },
        ];
        const shared = 'hsl(45, 20%, 93%)';
        expect(recolorValue(shared, bids)).toBe(recolorValue(shared, [bids[1]]));
    });
});
