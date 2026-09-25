/**
 * One case per claim: a camera, a set of knobs, and an id the assertions name.
 *
 * Data only — no DOM, no canvas — because the Playwright specs import this list to drive the
 * harness and to name their snapshots, and they run in Node.
 *
 * @module
 */

import type { MapEffectsSettings } from '../../index';
import type { CameraAngles } from '../../src/effectFilters';
import { CROSS_STREET } from './subject';

/**
 * The camera a case pretends to have been shot with. A drawn canvas has none, and two angles is all
 * a depth of field reads — so a case can state one in a literal and the pass then runs exactly the
 * arithmetic it runs on a tilted map.
 */
const TILTED: CameraAngles = { pitch: 60, verticalFieldOfView: 36.87 };
/** Straight down: the depth ramp is 0 here, which is the geometry that ends the effect on its own. */
const LEVEL: CameraAngles = { pitch: 0, verticalFieldOfView: 36.87 };

/** The lens every depth-of-field case is shot with, minus the knob under test. */
const APERTURE = { 'depthOfField.intensity': 22, 'depthOfField.bokeh': 0.5 } as const;

/** The glow the bloom cases share, so a pair differs only in the knob it is named for. */
const GLOW = { 'bloom.intensity': 0.8, 'bloom.radius': 14 } as const;

export type EffectCase = {
    id: string;
    settings: MapEffectsSettings;
    /** Absent is level: only the lens reads the camera. */
    camera?: CameraAngles;
};

export const EFFECT_CASES: EffectCase[] = [
    // The control every measurement below is taken against.
    { id: 'plain', settings: {} },

    { id: 'bloom', settings: { ...GLOW, 'bloom.threshold': 0.4 } },
    // A higher cut keeps less of the picture, so it must add less light — never more.
    { id: 'bloom-high-cut', settings: { ...GLOW, 'bloom.threshold': 0.85 } },
    { id: 'fog', settings: { 'fog.intensity': 0.9, 'fog.reach': 0.5 } },
    // Bloom under a rim effect: the pair that catches a blend mode reading the wrong backdrop and
    // subtracting light where it should add it.
    { id: 'bloom-and-fog', settings: { ...GLOW, 'bloom.threshold': 0.4, 'fog.intensity': 0.9, 'fog.reach': 0.5 } },
    // The scopes, narrowing from `bloom` above, one per kind of entry: a group, a knob, a CSS
    // colour. The stub map's traffic palette is in `main.ts`.
    { id: 'bloom-scope-traffic', settings: { ...GLOW, 'bloom.threshold': 0.4, 'bloom.only': ['traffic'] } },
    {
        id: 'bloom-scope-major',
        settings: { ...GLOW, 'bloom.threshold': 0.4, 'bloom.only': ['traffic.incidents.majorColor'] },
    },
    { id: 'bloom-scope-literal', settings: { ...GLOW, 'bloom.threshold': 0.4, 'bloom.only': [CROSS_STREET] } },

    { id: 'grade-brighter', settings: { 'grade.brightness': 1.4 } },
    { id: 'grade-darker', settings: { 'grade.brightness': 0.6 } },
    { id: 'grade-harder', settings: { 'grade.contrast': 1.5 } },
    { id: 'grade-softer', settings: { 'grade.contrast': 0.6 } },
    { id: 'grade-greyscale', settings: { 'grade.saturation': 0 } },
    { id: 'tint', settings: { 'tint.color': '#ff7a1a', 'tint.opacity': 0.5 } },

    { id: 'vignette', settings: { 'vignette.intensity': -0.8, 'vignette.reach': 0.5 } },
    { id: 'edge-blur', settings: { 'edgeBlur.intensity': 20, 'edgeBlur.reach': 0.5 } },

    // Focused on the nearest ground, which on a tilted frame is its bottom row.
    {
        id: 'depth-of-field-near',
        camera: TILTED,
        settings: { ...APERTURE, 'depthOfField.focus': 0, 'depthOfField.band': 0.1 },
    },
    // The same lens aimed the other way round, so the foreground is the part that goes.
    {
        id: 'depth-of-field-far',
        camera: TILTED,
        settings: { ...APERTURE, 'depthOfField.focus': 1, 'depthOfField.band': 0.1 },
    },
    // A band held in the middle with both ends falling away — the shape no single ramp has. Shot
    // at a wider aperture than the pair above: this is the only case whose claim is about the two
    // *ends* of the frame, and each of them is half as far from the plane of focus as the far end
    // is in those, so it needs the blur to be worth measuring there.
    {
        id: 'depth-of-field-band',
        camera: TILTED,
        settings: { ...APERTURE, 'depthOfField.intensity': 30, 'depthOfField.focus': 0.5, 'depthOfField.band': 0 },
    },
    // The same knobs over a level camera: nothing switches the effect off, the depth it works in is
    // simply zero.
    {
        id: 'depth-of-field-level',
        camera: LEVEL,
        settings: { ...APERTURE, 'depthOfField.focus': 0, 'depthOfField.band': 0.1 },
    },
    // The bokeh pair. Both defocus the same distances by the same amount; they differ only in
    // whether a bright sample outweighs a dull one.
    {
        id: 'depth-of-field-averaged',
        camera: TILTED,
        settings: { ...APERTURE, 'depthOfField.focus': 0, 'depthOfField.band': 0, 'depthOfField.bokeh': 0 },
    },
    {
        id: 'depth-of-field-bokeh',
        camera: TILTED,
        settings: { ...APERTURE, 'depthOfField.focus': 0, 'depthOfField.band': 0, 'depthOfField.bokeh': 1 },
    },
    // The ordering claim: bloom reads what the lens left rather than the map behind it.
    {
        id: 'depth-of-field-and-bloom',
        camera: TILTED,
        settings: {
            ...APERTURE,
            'depthOfField.focus': 0,
            'depthOfField.band': 0.1,
            ...GLOW,
            'bloom.threshold': 0.4,
        },
    },
];
