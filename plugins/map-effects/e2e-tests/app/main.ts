/**
 * The harness the visual suite drives: one case at a time, mounted over the synthetic map, with the
 * measurements the specs read back exposed on `window`.
 *
 * It mounts the **real** {@link MapEffects} rather than rebuilding its overlays here. A harness that
 * drew its own would photograph itself and pass while the plugin was broken, which is the failure
 * this suite exists to catch.
 *
 * @module
 */

import { type StylingKnobId, StylingModule, type TomTomMap } from '@tomtom-org/maps-sdk/map';
import { MapEffects } from '../../index';
import { ScreenPassRenderer } from '../../src/gpu/screenPass';
import { EFFECT_CASES } from './cases';
import { metricsOf, rimDifference } from './measure';
import { CROSS_STREET, paintSubject, STREET, SUBJECT_SIZE } from './subject';

/** What the harness exposes to the Playwright specs. */
export type Harness = {
    mount(caseId: string): Promise<void>;
    metricsOf: typeof metricsOf;
    rimDifference: typeof rimDifference;
    chainProbe(): number[];
};

declare global {
    var mapEffectsHarness: Harness;
}

const stage = document.querySelector<HTMLElement>('#case');
const canvas = document.querySelector<HTMLCanvasElement>('#subject');
if (!stage || !canvas) throw new Error('the harness page is missing its stage');

canvas.width = SUBJECT_SIZE;
canvas.height = SUBJECT_SIZE;
const subjectContext = canvas.getContext('2d');
if (!subjectContext) throw new Error('no 2d context to paint the subject in');

paintSubject(subjectContext);

/**
 * A map that is a canvas and two angles.
 *
 * All the plugin reads of a map: the pixels to work from, the container to hang the overlays in,
 * and the camera a depth of field is a function of. Stating the camera in a literal is honest
 * rather than a shortcut — a drawn canvas has no camera, and two angles is the whole of what the
 * lens reads, so the pass runs exactly the arithmetic it runs on a tilted map.
 */
const stubMap = (pitch: number, verticalFieldOfView: number): TomTomMap =>
    ({
        mapLibreMap: {
            getCanvas: () => canvas,
            getContainer: () => stage,
            getPitch: () => pitch,
            getVerticalFieldOfView: () => verticalFieldOfView,
            // The subject never repaints, so the effects draw once from the canvas below them,
            // which is all a still case needs.
            on: () => {},
            off: () => {},
        },
        styleLightDarkTheme: 'dark',
    }) as unknown as TomTomMap;

// The stub style's traffic: the streets flow freely and the cross streets are major jams, so
// `traffic` keys both and `traffic.incidents.majorColor` the cross streets alone. The lamps wear no knob's colour.
const TRAFFIC_PALETTE: Partial<Record<StylingKnobId, string>> = {
    'traffic.flow.freeColor': STREET,
    'traffic.incidents.majorColor': CROSS_STREET,
};

// A stub has no style to resolve a scope against, and `get` is all a scope reads of the module.
StylingModule.get = async () => ({ get: (id: StylingKnobId) => TRAFFIC_PALETTE[id] }) as unknown as StylingModule;

let mounted: MapEffects | undefined;

// Two frames for the overlays to have drawn — bloom reads the canvas below it in an animation
// frame, and the chain blits its pass into one — then a moment for the compositor to have run the
// `backdrop-filter` layers, which is what a screenshot photographs.
const settled = (): Promise<void> =>
    new Promise((resolve) => {
        requestAnimationFrame(() => requestAnimationFrame(() => setTimeout(resolve, 150)));
    });

const mount = async (caseId: string): Promise<void> => {
    mounted?.remove();
    const entry = EFFECT_CASES.find((candidate) => candidate.id === caseId);
    if (!entry) throw new Error(`no such effect case: ${caseId}`);

    const { pitch = 0, verticalFieldOfView = 36.87 } = entry.camera ?? {};
    mounted = new MapEffects(stubMap(pitch, verticalFieldOfView), entry.settings);
    await settled();
};

/**
 * The colour a two-stage chain leaves in the middle of the frame, as `[r, g, b, a]`.
 *
 * The one claim about the substrate that no effect can make on its own, because the plugin ships a
 * single pass: that a stage reads what the stage before it wrote. The first shader takes the green
 * out and the second rotates the channels into it, so a chain that ran both over the source — or
 * dropped one — hands back the green the first pass should have destroyed.
 */
const chainProbe = (): number[] => {
    const source = document.createElement('canvas');
    source.width = 32;
    source.height = 32;
    const context = source.getContext('2d');
    if (!context) throw new Error('no 2d context to probe the chain with');

    context.fillStyle = 'rgb(80, 120, 40)';
    context.fillRect(0, 0, source.width, source.height);

    const renderer = new ScreenPassRenderer();
    const rendered = renderer.render(source, [
        {
            fragment: 'void main() { fragColor = vec4(texture(uSource, vUv).rgb * vec3(1.0, 0.0, 1.0), 1.0); }',
            uniforms: {},
        },
        { fragment: 'void main() { fragColor = vec4(texture(uSource, vUv).gbr, 1.0); }', uniforms: {} },
    ]);
    if (!rendered) throw new Error('the chain rendered nothing');

    const readback = document.createElement('canvas');
    readback.width = rendered.width;
    readback.height = rendered.height;
    const readbackContext = readback.getContext('2d');
    if (!readbackContext) throw new Error('no 2d context to read the chain back into');

    readbackContext.drawImage(rendered, 0, 0);
    const middle = readbackContext.getImageData(readback.width / 2, readback.height / 2, 1, 1);
    renderer.remove();
    return [...middle.data];
};

globalThis.mapEffectsHarness = { mount, metricsOf, rimDifference, chainProbe };
