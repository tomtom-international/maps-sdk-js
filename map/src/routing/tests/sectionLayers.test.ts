import { inputSectionTypesWithGuidance } from '@tomtom-org/maps-sdk/core';
import type { LineLayerSpecification, SymbolLayerSpecification } from 'maplibre-gl';
import { describe, expect, test } from 'vitest';
import { buildRoutingLayers } from '../layers/routingLayers';
import {
    isSectionVisible,
    sectionLine,
    sectionLineLayerID,
    sectionSignLayerID,
    sectionStyleAnchor,
    sectionSymbolLayerID,
} from '../layers/sectionLayers';
import {
    bandedSectionTypes,
    bespokeSectionTypes,
    drawnSectionTypes,
    generatedSectionTypes,
    postsSign,
    SECTION_REGISTRY,
    sectionDrawsByDefault,
    sectionSourceKey,
    sectionSupportsKnob,
} from '../layers/sectionRegistry';
import type { RoutingModuleConfig } from '../types/routeModuleConfig';
import { createLayersSpecs } from '../util/config';

type GeneratedType = (typeof generatedSectionTypes)[number];

// The layers of one generated section, reached the way a caller would.
const builtSection = (type: GeneratedType, config?: RoutingModuleConfig) =>
    (buildRoutingLayers(config).sections?.[type] ?? {}) as Record<string, Partial<LineLayerSpecification>> &
        Record<string, Partial<SymbolLayerSpecification>>;

const builtLine = (type: GeneratedType, config?: RoutingModuleConfig): Partial<LineLayerSpecification> =>
    builtSection(type, config)[sectionLineLayerID(type)] as Partial<LineLayerSpecification>;

const builtSymbol = (type: GeneratedType, config?: RoutingModuleConfig): Partial<SymbolLayerSpecification> =>
    builtSection(type, config)[sectionSymbolLayerID(type)] as Partial<SymbolLayerSpecification>;

/** `toSorted()` orders by UTF-16 code unit without one, which is not the order these are read in. */
const alphabetically = (left: string, right: string): number => left.localeCompare(right);

describe('the section registry covers every type the API can return', () => {
    test('only the four documented exceptions are left undrawn', () => {
        const covered = new Set<string>(drawnSectionTypes);
        const uncovered = inputSectionTypesWithGuidance.filter((type) => !covered.has(type));
        // The exceptions, and why each one is drawn by nothing:
        //  - `country` tiles a route end to end, so a line for it covers the whole route to say
        //    only that it is in a country; the crossing the driver wants is a border the base map
        //    already draws. The sections themselves stay on the route — the speed limit signs read
        //    them for the face and unit each stretch is posted in.
        //  - `lanes` describes a lane-assist HUD, not a geographic overlay, so it is a component.
        //  - `roadShields` needs shield images loaded from the atlas the response points at, plus a
        //    symbol layer — a separate piece of work, not a colour on a line.
        //  - `toll` is already on screen: `tollRoad` reports every stretch `toll` does and adds the
        //    schemes that are not a per-use toll, so a second overlay would draw the same geometry
        //    twice.
        // `DrawnSectionType` is derived from the core vocabulary and `SECTION_REGISTRY` is keyed by
        // it, so the compiler already rejects a section type nobody classified. This covers what it
        // cannot see: a type classified as drawn but left out of the arrays built from it.
        expect(uncovered.toSorted(alphabetically)).toEqual(['country', 'lanes', 'roadShields', 'toll']);
    });

    test('the generated and bespoke lists partition the drawn types', () => {
        const overlapping = generatedSectionTypes.filter((type) => bespokeSectionTypes.includes(type as never));
        expect(overlapping).toEqual([]);
        expect(drawnSectionTypes).toHaveLength(generatedSectionTypes.length + bespokeSectionTypes.length);
        expect(Object.keys(SECTION_REGISTRY).toSorted(alphabetically)).toEqual(
            [...drawnSectionTypes].toSorted(alphabetically),
        );
    });

    test('every type names a source, and the generated ones own a source each', () => {
        const bespokeSourceKeys = ['incidents', 'ferries', 'tunnels', 'tollRoads', 'vehicleRestricted'];
        for (const type of generatedSectionTypes) {
            expect(sectionSourceKey(type)).toBe(`${type}Sections`);
            expect(bespokeSourceKeys).not.toContain(sectionSourceKey(type));
        }
        for (const type of bespokeSectionTypes) {
            expect(bespokeSourceKeys).toContain(sectionSourceKey(type));
        }
    });

    test('layer ids are unique across every generated section', () => {
        const ids = [
            ...generatedSectionTypes.map(sectionLineLayerID),
            ...generatedSectionTypes.map(sectionSymbolLayerID),
            ...generatedSectionTypes.map(sectionSignLayerID),
        ];
        expect(new Set(ids).size).toBe(ids.length);
    });

    test('a generated type either bands the route or posts a sign, never both', () => {
        // The band fields and the sign knob are the two halves of the same decision, so a type
        // carrying one must not carry the other.
        for (const type of generatedSectionTypes) {
            const banded = bandedSectionTypes.includes(type as never);
            expect(banded, type).toBe(!postsSign(type));
            expect(sectionSupportsKnob(type, 'style'), type).toBe(banded);
        }
        expect(generatedSectionTypes.filter(postsSign)).toEqual(['speedLimit']);
    });
});

// The types drawn before anything is configured: each one's stretches are sparse along a route and
// consequential — money to pay, a permit to hold, a road the vehicle may not use, or the vehicle
// going onto a train. Listed here rather than derived, so widening the set stays a deliberate edit.
const DRAWN_BY_DEFAULT = new Set<string>([
    'carTrain',
    'ferry',
    'lowEmissionZone',
    'speedLimit',
    'tollRoad',
    'tollVignette',
    'traffic',
    'tunnel',
    'vehicleRestricted',
]);

describe('what a section looks like before anything is configured', () => {
    test('the sparse, consequential types draw themselves and the rest wait to be asked', () => {
        // A type that bands the route is opt-in once its stretches cover most of one, however
        // consequential it is: `motorway`, `urban` and `country` would stripe every map the SDK
        // already renders. `speedLimit` is the exception because it does not band at all — its
        // sign is legible wherever it lands.
        for (const type of drawnSectionTypes) {
            expect(isSectionVisible(type), type).toBe(DRAWN_BY_DEFAULT.has(type));
        }
    });

    test('a caller can ask which types draw themselves, rather than reading it off the map', () => {
        // A route carrying no ferry sections draws no ferry layer, so a panel reading layer
        // visibility cannot tell a type that is off from one with nothing to show.
        for (const type of drawnSectionTypes) {
            expect(sectionDrawsByDefault(type), type).toBe(isSectionVisible(type));
        }
    });

    test('speedLimit answers to the sign knobs and to none of the band knobs', () => {
        // Its presentation is the number, so there is no line to colour, widen, dash or place an
        // icon on — and `visible` means the signs, because they are all it draws.
        expect(sectionSupportsKnob('speedLimit', 'sign')).toBe(true);
        expect(isSectionVisible('speedLimit')).toBe(true);
        expect(isSectionVisible('speedLimit', { visible: false })).toBe(false);

        for (const knob of ['color', 'opacity', 'width', 'style', 'pattern', 'icon'] as const) {
            expect(sectionSupportsKnob('speedLimit', knob), knob).toBe(false);
        }
        // And it is the only type with a sign, so no other grows one by surprise.
        for (const type of drawnSectionTypes.filter((other) => other !== 'speedLimit')) {
            expect(sectionSupportsKnob(type, 'sign'), type).toBe(false);
        }
    });

    test('an opt-in type registers its layer hidden, so asking for it is a config line', () => {
        for (const type of bandedSectionTypes) {
            const expectedVisibility = DRAWN_BY_DEFAULT.has(type) ? undefined : 'none';
            expect(sectionLine(type).layout?.visibility, type).toBe(expectedVisibility);
        }
    });

    test('generated sections draw only on the selected route, like the bespoke ones', () => {
        for (const type of bandedSectionTypes) {
            expect(sectionLine(type).filter).toEqual(['==', ['get', 'routeState'], 'selected']);
        }
    });

    test('generated sections are partially transparent, so the route line stays readable', () => {
        for (const type of bandedSectionTypes) {
            const opacity = sectionLine(type).paint?.['line-opacity'];
            expect(typeof opacity).toBe('number');
            expect(opacity as number).toBeGreaterThan(0);
            expect(opacity as number).toBeLessThan(1);
        }
    });

    test('each banding type has its own default colour', () => {
        const colors = bandedSectionTypes.map((type) => sectionLine(type).paint?.['line-color']);
        expect(new Set(colors).size).toBe(colors.length);
    });

    test('a generated section is a halo, so it bands the route rather than hiding under it', () => {
        // The route's own outline is opaque and wider than its line at every zoom, so a section
        // sitting beneath the route at the line's width renders no visible pixels at all. Hence
        // `halo` — wider, and under the route — as the default for every generated type.
        const halo = sectionLine('motorway').paint?.['line-width'];
        const inline = sectionLine('motorway', { style: 'inline' }).paint?.['line-width'];
        expect(halo).not.toEqual(inline);
        expect(SECTION_REGISTRY.motorway.style).toBe('halo');
    });

    test('the draw style decides the layer the section is inserted beneath', () => {
        // A halo has to go under the route's own lines and an inline section over them, so the
        // style picks the anchor as well as the width.
        expect(sectionStyleAnchor('motorway')).toBe('routeDeselectedOutline');
        expect(sectionStyleAnchor('motorway', { style: 'inline' })).toBe('routeLineArrows');
        expect(sectionStyleAnchor('tunnel')).toBe('routeLineArrows');
        expect(sectionStyleAnchor('tunnel', { style: 'halo' })).toBe('routeDeselectedOutline');
    });

    test('the style knob moves a bespoke type against the route line', () => {
        const layers = buildRoutingLayers({ sections: { tollRoad: { style: 'inline' } } });
        expect(layers.sections?.tollRoad?.routeTollRoadOutline?.beforeID).toBe('routeLineArrows');
        expect(buildRoutingLayers().sections?.tollRoad?.routeTollRoadOutline?.beforeID).toBe('routeDeselectedOutline');
    });
});

describe('the uniform knobs reach every drawn type', () => {
    test('color, opacity, width and visibility are honoured on a generated type', () => {
        const layer = sectionLine('urban', { visible: true, color: '#123456', opacity: 0.9, width: 'l' });
        expect(layer.paint?.['line-color']).toBe('#123456');
        expect(layer.paint?.['line-opacity']).toBe(0.9);
        expect(layer.layout?.visibility).toBeUndefined();
        expect(layer.paint?.['line-width']).not.toEqual(sectionLine('urban').paint?.['line-width']);
    });

    test('the same knobs reach a bespoke type', () => {
        const layers = buildRoutingLayers({ sections: { tunnel: { color: '#402060', opacity: 0.75, width: 'l' } } });
        const tunnel = layers.sections?.tunnel?.routeTunnelLine;
        expect(tunnel?.paint?.['line-color']).toBe('#402060');
        expect(tunnel?.paint?.['line-opacity']).toBe(0.75);
        expect(tunnel?.paint?.['line-width']).not.toEqual(
            buildRoutingLayers().sections?.tunnel?.routeTunnelLine?.paint?.['line-width'],
        );
    });

    test('switching a bespoke type off hides its layers', () => {
        const layers = buildRoutingLayers({ sections: { traffic: { visible: false } } });
        expect(layers.sections?.traffic?.routeIncidentBackgroundLine?.layout?.visibility).toBe('none');
        expect(layers.sections?.traffic?.routeIncidentJamSymbol?.layout?.visibility).toBe('none');
    });

    test('a knob a type does not carry is left alone rather than applied', () => {
        // `traffic` colours its line by `magnitudeOfDelay` and dashes it by severity, so it offers
        // neither `color` nor `pattern`. TypeScript rejects both; JavaScript callers reach here.
        expect(sectionSupportsKnob('traffic', 'color')).toBe(false);
        expect(sectionSupportsKnob('traffic', 'pattern')).toBe(false);
        const configured = buildRoutingLayers({
            // @ts-expect-error - the knobs `traffic` does not carry are not in its config type
            sections: { traffic: { color: '#FF0000', pattern: 'solid' } },
        });
        const plain = buildRoutingLayers();
        expect(configured.sections?.traffic?.routeIncidentBackgroundLine?.paint?.['line-color']).toEqual(
            plain.sections?.traffic?.routeIncidentBackgroundLine?.paint?.['line-color'],
        );
        expect(configured.sections?.traffic?.routeIncidentDashedLine?.paint?.['line-dasharray']).toEqual(
            plain.sections?.traffic?.routeIncidentDashedLine?.paint?.['line-dasharray'],
        );
    });

    test('the pattern knob sets and clears the dashes', () => {
        expect(sectionLine('urban', { pattern: 'dashed' }).paint?.['line-dasharray']).toEqual([2, 1.5]);
        expect(sectionLine('urban', { pattern: 'dotted' }).paint?.['line-dasharray']).toEqual([0, 1.5]);
        // `carTrain` is dashed by default, so `solid` has to remove what the default put there.
        expect(sectionLine('carTrain').paint?.['line-dasharray']).toEqual([2, 1.5]);
        expect(sectionLine('carTrain', { pattern: 'solid' }).paint?.['line-dasharray']).toBeUndefined();
    });

    test('a two-line type takes the colour on its principal line and derives the other', () => {
        const restricted = buildRoutingLayers({ sections: { vehicleRestricted: { color: '#40C0FF' } } }).sections
            ?.vehicleRestricted;
        expect(restricted?.routeVehicleRestrictedForegroundLine?.paint?.['line-color']).toBe('#40C0FF');
        const background = restricted?.routeVehicleRestrictedBackgroundLine?.paint?.['line-color'];
        expect(background).toBeDefined();
        expect(background).not.toBe('#40C0FF');
    });

    test('only the principal line of a two-line type carries the pattern', () => {
        const restricted = buildRoutingLayers().sections?.vehicleRestricted;
        // The dots are the restriction; the background is the continuous halo they sit on.
        expect(restricted?.routeVehicleRestrictedForegroundLine?.paint?.['line-dasharray']).toEqual([0, 1.5]);
        expect(restricted?.routeVehicleRestrictedBackgroundLine?.paint?.['line-dasharray']).toBeUndefined();
    });
});

describe('the icon knob', () => {
    test('adds a symbol layer to a generated section, placed at the section centre', () => {
        const symbol = builtSymbol('lowEmissionZone', {
            sections: { lowEmissionZone: { visible: true, icon: { image: 'poi-toll_plaza' } } },
        });
        expect(symbol).toBeDefined();
        expect(symbol.layout?.['icon-image']).toBe('poi-toll_plaza');
        expect(symbol.layout?.['symbol-placement']).toBe('line-center');
    });

    test('repeats the icon along the section when asked to', () => {
        const symbol = builtSymbol('urban', {
            sections: { urban: { visible: true, icon: { image: 'poi-toll_plaza', placement: 'along', size: 0.5 } } },
        });
        expect(symbol.layout?.['symbol-placement']).toBe('line');
        expect(symbol.layout?.['icon-size']).toBe(0.5);
    });

    test('adds nothing where no icon was asked for', () => {
        const built = builtSection('urban', { sections: { urban: { visible: true } } });
        expect(built[sectionSymbolLayerID('urban')]).toBeUndefined();
        expect(Object.keys(built)).toEqual([sectionLineLayerID('urban')]);
    });

    test('replaces the image on a type that already draws one', () => {
        const layers = buildRoutingLayers({ sections: { tollRoad: { icon: { image: 'poi-parking_garage' } } } });
        expect(layers.sections?.tollRoad?.routeTollRoadSymbol?.layout?.['icon-image']).toBe('poi-parking_garage');
    });
});

describe('wiring into the module configuration', () => {
    test('buildRoutingLayers produces one line layer per banding type, and a sign instead', () => {
        for (const type of bandedSectionTypes) {
            expect(builtSection(type)[sectionLineLayerID(type)], `missing line layer for ${type}`).toBeDefined();
            expect(builtSection(type)[sectionSignLayerID(type)], `unexpected sign layer for ${type}`).toBeUndefined();
        }
        const speedLimit = builtSection('speedLimit');
        expect(Object.keys(speedLimit)).toEqual([sectionSignLayerID('speedLimit')]);
    });

    test('the semantic config reaches the built layer', () => {
        expect(builtLine('motorway', { sections: { motorway: { color: '#ABCDEF' } } }).paint?.['line-color']).toBe(
            '#ABCDEF',
        );
    });

    test('a raw layer spec still overrides the semantic tier', () => {
        const layer = builtLine('motorway', {
            sections: { motorway: { color: '#ABCDEF' } },
            layers: {
                sections: { motorway: { routeSectionMotorwayLine: { paint: { 'line-color': '#000000' } } } },
            },
        });
        expect(layer.paint?.['line-color']).toBe('#000000');
        // Deep-merged, so the opacity default survives a paint override.
        expect(layer.paint?.['line-opacity']).toBeDefined();
    });

    test('createLayersSpecs files each generated section under its own prefixed source key', () => {
        const specs = createLayersSpecs(buildRoutingLayers(undefined, 'routes-1'), 'routes-1');
        for (const type of generatedSectionTypes) {
            // One layer each, and which one it is follows the type's presentation.
            const expectedID = postsSign(type) ? sectionSignLayerID(type) : sectionLineLayerID(type);
            expect(
                specs[sectionSourceKey(type)].map((spec) => spec.id),
                type,
            ).toEqual([`routes-1-${expectedID}`]);
        }
    });

    test('an icon adds a second spec to that section source, and nothing to the others', () => {
        const config: RoutingModuleConfig = {
            sections: { urban: { visible: true, icon: { image: 'poi-toll_plaza' } } },
        };
        const specs = createLayersSpecs(buildRoutingLayers(config, 'routes-1'), 'routes-1');
        expect(specs.urbanSections.map((spec) => spec.id)).toEqual([
            `routes-1-${sectionLineLayerID('urban')}`,
            `routes-1-${sectionSymbolLayerID('urban')}`,
        ]);
        expect(specs.motorwaySections).toHaveLength(1);
    });
});
