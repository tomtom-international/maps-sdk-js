import { type KnobDescriptor, knob, StylingModule, type TomTomMap } from '@tomtom-org/maps-sdk/map';
import {
    applyScopeMask,
    type BloomScope,
    buildScopeMask,
    invalidScopeEntry,
    scopeColors,
    scopeReadsStyling,
} from './bloomScope';
import { compositeEffects } from './composite';
import {
    bloomFilter,
    type CameraAngles,
    defocusFilter,
    defocusUniforms,
    fogFilter,
    fogVeil,
    gradeFilter,
    rimMask,
    vignetteGradient,
} from './effectFilters';
import {
    type EffectKnobDefinition,
    type EffectKnobId,
    type EffectKnobRange,
    type EffectKnobValueOf,
    effectKnobDefinitions,
    effectKnobIds,
} from './effectsCatalogue';
import type { EffectValues } from './effectValues';
import { withDefaults } from './effectValues';
import { DEFOCUS_SHADER } from './gpu/defocusShader';
import type { PassStage } from './gpu/screenPass';
import { resizeCanvas, ScreenPassRenderer } from './gpu/screenPass';

/**
 * The effect knob values an app sets — only the overridden ones, serializable like the SDK's
 * styling settings.
 *
 * @group Map Effects
 */
export type MapEffectsSettings = { [ID in EffectKnobId]?: EffectKnobValueOf<ID> };

/**
 * One entry of the effects catalogue: the SDK's shared {@link KnobDescriptor}, narrowed the way
 * `StylingKnobDescriptor` narrows it, plus the use case the effect serves.
 *
 * @group Map Effects
 */
export type MapEffectsKnobDescriptor = KnobDescriptor<EffectKnobValueOf<EffectKnobId>> & {
    /** The knob's id, as accepted by {@link MapEffects.set}. */
    id: EffectKnobId;
    /** The range of valid values, for a numeric knob. */
    range?: EffectKnobRange;
    /** Always `true`: an effect reads the rendered pixels, so it has something to work on anywhere. */
    available: boolean;
    /** Always `any-style`, for the same reason. */
    appliesTo: string;
    /** The practical problem the effect solves. */
    useCase: string;
};

/**
 * The effects catalogue, in the same shape as `StylingModule.describe()` so one control panel or
 * agent tool can drive both.
 *
 * @group Map Effects
 */
export type MapEffectsCatalogue = { knobs: MapEffectsKnobDescriptor[] };

/**
 * Options for {@link MapEffects.capture}.
 *
 * @group Map Effects
 */
export type CaptureOptions = {
    /**
     * Device pixels per CSS pixel to render at. Defaults to the map's current ratio; `2` or `3` gives
     * a print-grade capture of the same view. MapLibre clamps to its `maxCanvasSize`, so measure the
     * ratio you got from the returned canvas rather than assuming.
     */
    pixelRatio?: number;
};

// Overlay layers in compositing order; each is one absolutely positioned element over the canvas.
// The GPU chain is not among them: it renders the picture the rest of these read, so it sits under
// all of them — see `artworkCanvas`.
const OVERLAYS = ['bloom', 'grade', 'fog', 'edgeBlur', 'tint', 'vignette'] as const;
type OverlayName = (typeof OVERLAYS)[number];

// Safari still needs `-webkit-backdrop-filter`, which the DOM typings do not carry.
type OverlayStyle = Partial<CSSStyleDeclaration> & { webkitBackdropFilter?: string };

// A filter and a mask each go on under both the standard property and the prefixed one.
const backdropFilterStyle = (filter: string): OverlayStyle => ({
    backdropFilter: filter,
    webkitBackdropFilter: filter,
});
const maskStyle = (mask: string): OverlayStyle => ({ maskImage: mask, webkitMaskImage: mask });

// Every layer the plugin hangs over the map — the overlays and the chain's own canvas — covers the
// container exactly, takes no pointer events, and starts hidden.
const LAYER_STYLE = {
    position: 'absolute',
    inset: '0',
    width: '100%',
    height: '100%',
    pointerEvents: 'none',
    display: 'none',
} satisfies Partial<CSSStyleDeclaration>;

// Device pixels per CSS pixel of a canvas — what keeps a radius in CSS pixels wherever it is used.
const rasterScaleOf = (canvas: HTMLCanvasElement): number => canvas.width / Math.max(canvas.clientWidth, 1);

/**
 * Coalesces however many requests arrive into one `draw` per animation frame. Both the chain and
 * the bloom are made out of the map's pixels and follow its `render` event, which fires more often
 * than a frame can be drawn.
 */
const drawOncePerFrame = (draw: () => void) => {
    let frame: number | undefined;
    return {
        schedule: () => {
            if (frame !== undefined) return;

            frame = requestAnimationFrame(() => {
                frame = undefined;
                draw();
            });
        },
        cancel: () => {
            if (frame !== undefined) cancelAnimationFrame(frame);
            frame = undefined;
        },
    };
};

// The bloom canvas renders at a quarter of the pixels; its blur radius is divided to match.
const BLOOM_SCALE = 0.5;

// Below this difference a requested capture ratio is the one the map already renders at.
const RATIO_EPSILON = 0.01;

// `setPixelRatio(null)` is MapLibre's "follow the device again", which its typings spell as a number
// only — and a number would pin an override instead.
type PixelRatioSetter = { setPixelRatio(pixelRatio: number | null): void };

/**
 * Practical post-processing for a {@link TomTomMap}: effects computed from the rendered map's own
 * pixels, not from its style — so they work on every style, custom ones included, survive every
 * style release, and cannot be reproduced by editing the style at all.
 *
 * @remarks
 * Every effect is named by the problem it solves, and off by default:
 * - **bloom** — emphasis on dark and driving styles: lit roads, traffic tubes and route lines glow;
 * - **grade** (brightness, contrast, saturation) and **tint** — muting the base map so a data overlay
 *   reads first;
 * - **fog** — depth: the rim is blurred *and* washed towards the colour of the air, which follows the
 *   map's light/dark theme;
 * - **edge blur** — focus: the rim is blurred and keeps its colour, so it reads as a lens rather than
 *   as distance;
 * - **depth of field** — depth on a tilted map: one band of *distance* stays sharp and the rest
 *   defocuses, worked out from the camera's pitch and field of view, so a flat map ends it;
 * - **vignette** — focus too, by darkening or lightening the edges.
 *
 * Effects render live as layers over the map canvas (a WebGL2 chain under `backdrop-filter`
 * overlays; bloom is a small canvas blended in `screen` mode) and are composited the same way into
 * {@link capture}, so what is captured is what was on screen. Bloom, the depth of field and capture
 * read the map canvas, which needs
 * `mapLibre: { canvasContextAttributes: { preserveDrawingBuffer: true } }` when creating the map;
 * the plugin warns once when it is missing.
 *
 * {@link describe} returns the knobs in the same shape as `StylingModule.describe()`, so a control
 * panel or an agent tool built for the SDK's styling catalogue reads this one unchanged.
 *
 * @example
 * ```typescript
 * import { MapEffects } from '@tomtom-org/maps-sdk-plugin-map-effects';
 *
 * const effects = new MapEffects(map);
 * // The data-viz muting half: a dim, desaturated base under your own layers.
 * effects.set({ 'grade.saturation': 0.4, 'grade.brightness': 0.85, 'tint.opacity': 0.15 });
 * // Night-driving emphasis on a dark style:
 * effects.set({ 'bloom.intensity': 0.5, 'bloom.threshold': 0.6 });
 *
 * const poster = await effects.capture({ pixelRatio: 3 });
 * ```
 *
 * @group Map Effects
 */
export class MapEffects {
    private settings: MapEffectsSettings = {};
    private readonly container: HTMLDivElement;
    private readonly overlays: Record<OverlayName, HTMLElement>;
    private readonly bloomCanvas: HTMLCanvasElement;
    private readonly artworkCanvas: HTMLCanvasElement;
    private readonly chain = new ScreenPassRenderer();
    private readonly chainDraw = drawOncePerFrame(() => this.drawChain());
    private readonly bloomDraw = drawOncePerFrame(() => this.drawBloom());
    // What a scope's named entries resolve through, requested only once a scope names one. The SDK
    // memoizes it per map, so it is the instance the app styles the map with.
    private styling: StylingModule | undefined;
    private stylingRequest: Promise<void> | undefined;
    // Keyed on the scope's entries, since `set` replaces the array even when it is unchanged.
    private scopeMask: { key: string; tolerance: number; mask: Uint8Array | undefined } | undefined;
    private scopeCanvas: HTMLCanvasElement | undefined;
    private warnedBuffer = false;
    private warnedScope = false;
    // A style switch or a `StylingModule` recolour moves the colours a scope resolves to.
    private readonly onStyleData = () => this.dropScopeMask();
    private readonly onRender = () => {
        this.chainDraw.schedule();
        this.scheduleBloom();
    };

    /**
     * Attaches the effects to a map. Nothing is visible until {@link set} turns an effect on.
     *
     * @param map - The map to render effects over.
     * @param settings - Effect knob values to apply right away.
     */
    constructor(
        private readonly map: TomTomMap,
        settings: MapEffectsSettings = {},
    ) {
        const mapContainer = this.map.mapLibreMap.getContainer();
        this.container = document.createElement('div');
        this.container.className = 'tomtom-map-effects';
        Object.assign(this.container.style, {
            position: 'absolute',
            inset: '0',
            pointerEvents: 'none',
            overflow: 'hidden',
        } satisfies Partial<CSSStyleDeclaration>);
        // Right after the canvas container, so the map's own controls stay above the effects.
        const canvasContainer = mapContainer.querySelector('.maplibregl-canvas-container');
        canvasContainer?.insertAdjacentElement('afterend', this.container) ?? mapContainer.appendChild(this.container);

        this.bloomCanvas = document.createElement('canvas');
        this.overlays = Object.fromEntries(
            OVERLAYS.map((name) => {
                const element = name === 'bloom' ? this.bloomCanvas : document.createElement('div');
                element.dataset.effect = name;
                Object.assign(element.style, LAYER_STYLE);
                this.container.appendChild(element);
                return [name, element];
            }),
        ) as unknown as Record<OverlayName, HTMLElement>;
        this.bloomCanvas.style.mixBlendMode = 'screen';

        // The chain's own canvas goes under every overlay: it replaces the picture rather than
        // filtering it, so the `backdrop-filter` layers above read its result and not the map's.
        this.artworkCanvas = this.chain.canvas;
        this.artworkCanvas.dataset.effect = 'artwork';
        Object.assign(this.artworkCanvas.style, LAYER_STYLE);
        this.container.insertAdjacentElement('afterbegin', this.artworkCanvas);

        this.map.mapLibreMap.on('render', this.onRender);
        this.map.mapLibreMap.on('styledata', this.onStyleData);
        this.set(settings);
    }

    // The two angles a depth of field is a function of; nothing else about the camera changes it.
    private cameraAngles(): CameraAngles {
        const mapLibreMap = this.map.mapLibreMap;
        return { pitch: mapLibreMap.getPitch(), verticalFieldOfView: mapLibreMap.getVerticalFieldOfView() };
    }

    /**
     * Sets one or more effect knobs. Values are validated against the catalogue before anything is
     * touched; knobs not mentioned keep their values.
     *
     * @param settings - Knob id → value.
     * @throws `RangeError` for a value outside its range or of the wrong kind; `Error` for an unknown id.
     *
     * @example
     * ```typescript
     * effects.set({ 'vignette.intensity': -0.4 });
     * ```
     */
    set(settings: MapEffectsSettings): void {
        for (const [id, value] of Object.entries(settings)) {
            this.validate(id, value);
        }
        this.settings = { ...this.settings, ...settings };
        this.render();
    }

    /**
     * The current value of a knob: the override, or the catalogue default.
     */
    get<ID extends EffectKnobId>(id: ID): EffectKnobValueOf<ID> {
        this.assertKnob(id);
        return (this.settings[id] ?? effectKnobDefinitions[id].default) as EffectKnobValueOf<ID>;
    }

    /**
     * Turns a knob (or every knob) back to its default — for most effects, off.
     */
    reset(id?: EffectKnobId): void {
        if (id === undefined) {
            this.settings = {};
        } else {
            this.assertKnob(id);
            const { [id]: _removed, ...rest } = this.settings;
            this.settings = rest;
        }
        this.render();
    }

    /**
     * The overridden knobs, as a plain serializable object.
     */
    getConfig(): MapEffectsSettings {
        return { ...this.settings };
    }

    /**
     * Replaces every knob with the given settings (an empty object turns everything off).
     */
    applyConfig(settings: MapEffectsSettings): void {
        this.settings = {};
        this.set(settings);
    }

    /**
     * The effects catalogue: every knob with kind, range, default, current value and the practical
     * use case it serves. Same descriptor shape as `StylingModule.describe()`.
     */
    describe(): MapEffectsCatalogue {
        return {
            knobs: effectKnobIds.map((id): MapEffectsKnobDescriptor => {
                const definition = effectKnobDefinitions[id];
                return knob(id, definition.kind, definition.description, definition.default, this.settings[id], {
                    ...('range' in definition && { range: definition.range }),
                    ...('options' in definition && { options: definition.options }),
                    available: true,
                    appliesTo: 'any-style',
                    useCase: definition.useCase,
                });
            }),
        };
    }

    /**
     * Renders the current view — map and effects — into a canvas, optionally at a higher pixel ratio
     * for print. The map is re-rendered at that ratio (never resampled), read back once every tile is
     * drawn, and restored to follow the device afterwards.
     *
     * @remarks
     * Needs `preserveDrawingBuffer: true` on the map's canvas context; without it the map half of the
     * capture is blank. Viewers cannot download from a sandboxed page, so hand the canvas to your own
     * upload or `toBlob` flow.
     */
    async capture(options: CaptureOptions = {}): Promise<HTMLCanvasElement> {
        this.warnIfBufferNotPreserved();
        const mapLibreMap = this.map.mapLibreMap;
        const ratioSetter: PixelRatioSetter = mapLibreMap;
        const live = mapLibreMap.getPixelRatio();
        const wanted = options.pixelRatio ?? live;
        const wasOverridden = live !== (globalThis.devicePixelRatio || 1);
        const rerenders = Math.abs(wanted - live) > RATIO_EPSILON;
        if (rerenders) {
            ratioSetter.setPixelRatio(wanted);
            await this.settled();
        }
        try {
            return await this.readBack();
        } finally {
            if (rerenders) ratioSetter.setPixelRatio(wasOverridden ? live : null);
        }
    }

    /**
     * Detaches the effects from the map, removes their elements and releases the WebGL context the
     * chain holds — which a page with several maps on it needs, since a browser caps how many it
     * may keep alive.
     */
    remove(): void {
        this.map.mapLibreMap.off('render', this.onRender);
        this.map.mapLibreMap.off('styledata', this.onStyleData);
        this.bloomDraw.cancel();
        this.chainDraw.cancel();
        this.chain.remove();
        this.container.remove();
    }

    // ── Live rendering ────────────────────────────────────────────────────────────────────────

    private render(): void {
        const values = withDefaults(this.settings);
        const show = (name: OverlayName, on: boolean, style: OverlayStyle = {}) => {
            const element = this.overlays[name];
            element.style.display = on ? 'block' : 'none';
            Object.assign(element.style, style);
        };

        const grade = gradeFilter(values['grade.brightness'], values['grade.contrast'], values['grade.saturation']);
        show('grade', grade !== '', backdropFilterStyle(grade));

        const lightDark = this.map.styleLightDarkTheme;
        show('fog', values['fog.intensity'] > 0, {
            ...backdropFilterStyle(fogFilter(values['fog.intensity'], lightDark)),
            ...maskStyle(rimMask(values['fog.reach'])),
            backgroundImage: fogVeil(values['fog.intensity'], values['fog.reach'], lightDark),
        });

        show('edgeBlur', values['edgeBlur.intensity'] > 0, {
            ...backdropFilterStyle(defocusFilter(values['edgeBlur.intensity'])),
            ...maskStyle(rimMask(values['edgeBlur.reach'])),
        });

        if (values['depthOfField.intensity'] > 0) this.warnIfBufferNotPreserved();
        this.drawChain(values);

        show('tint', values['tint.opacity'] > 0, {
            backgroundColor: values['tint.color'],
            opacity: String(values['tint.opacity']),
        });

        show('vignette', values['vignette.intensity'] !== 0, {
            backgroundImage: vignetteGradient(values['vignette.intensity'], values['vignette.reach']),
        });

        const bloomOn = values['bloom.intensity'] > 0;
        show('bloom', bloomOn, { opacity: String(values['bloom.intensity']) });
        if (bloomOn) {
            this.warnIfBufferNotPreserved();
            this.scheduleBloom();
        }
    }

    /**
     * The passes the chain runs over the map's pixels, in order. One so far — the defocus — but the
     * substrate ping-pongs between render targets, so a second reads what the first left without
     * the picture leaving the GPU.
     */
    private chainStages(values: EffectValues): PassStage[] {
        const source = this.map.mapLibreMap.getCanvas();
        const uniforms = defocusUniforms(
            {
                focus: values['depthOfField.focus'],
                band: values['depthOfField.band'],
                blurCssPx: values['depthOfField.intensity'],
                bokeh: values['depthOfField.bokeh'],
            },
            this.cameraAngles(),
            { width: source.width, height: source.height, scale: rasterScaleOf(source) },
        );
        return uniforms ? [{ fragment: DEFOCUS_SHADER, uniforms, mipmapped: true }] : [];
    }

    private drawChain(values: EffectValues = withDefaults(this.settings)): void {
        const stages = this.chainStages(values);
        const rendered = stages.length ? this.chain.render(this.map.mapLibreMap.getCanvas(), stages) : undefined;
        this.artworkCanvas.style.display = rendered ? 'block' : 'none';
    }

    private scheduleBloom(): void {
        if (this.get('bloom.intensity') > 0) this.bloomDraw.schedule();
    }

    private drawBloom(): void {
        // The finished artwork when the chain drew one, so a defocused highlight glows as the wide
        // soft disc a photograph gives it rather than as the pinpoint it was before the lens.
        const source =
            this.artworkCanvas.style.display === 'block' ? this.artworkCanvas : this.map.mapLibreMap.getCanvas();
        const width = Math.max(1, Math.round(source.width * BLOOM_SCALE));
        const height = Math.max(1, Math.round(source.height * BLOOM_SCALE));
        resizeCanvas(this.bloomCanvas, width, height);
        const context = this.bloomCanvas.getContext('2d');
        if (!context) return;

        // The scope drops its uncovered pixels before the threshold, so the blur spreads only its colours.
        const glowSource = this.scopedSource(source, width, height) ?? source;
        context.filter = bloomFilter(this.get('bloom.radius'), this.get('bloom.threshold'), BLOOM_SCALE);
        context.clearRect(0, 0, width, height);
        context.drawImage(glowSource, 0, 0, width, height);
    }

    // The map's pixels with everything outside the scope blacked out; undefined when bloom lights the whole frame.
    private scopedSource(source: HTMLCanvasElement, width: number, height: number): HTMLCanvasElement | undefined {
        const mask = this.currentScopeMask();
        if (!mask) return undefined;

        this.scopeCanvas ??= document.createElement('canvas');
        const canvas = this.scopeCanvas;
        resizeCanvas(canvas, width, height);
        const context = canvas.getContext('2d', { willReadFrequently: true });
        if (!context) return undefined;

        context.clearRect(0, 0, width, height);
        context.drawImage(source, 0, 0, width, height);
        applyScopeMask(context, mask);
        return canvas;
    }

    // Cached: resolving the colours reads the styling catalogue and building the cube visits 32³ colours.
    private currentScopeMask(): Uint8Array | undefined {
        const scope = this.get('bloom.only');
        if (scope.length === 0) return undefined;

        const key = scope.join('\n');
        const tolerance = this.get('bloom.onlyTolerance');
        if (this.scopeMask?.key !== key || this.scopeMask.tolerance !== tolerance) {
            this.scopeMask = { key, tolerance, mask: this.buildScopeMaskFor(scope, tolerance) };
        }
        return this.scopeMask.mask;
    }

    private buildScopeMaskFor(scope: BloomScope, tolerance: number): Uint8Array | undefined {
        const readsStyling = scopeReadsStyling(scope);
        if (readsStyling) this.requestStyling();

        const colors = scopeColors(this.styling, scope);
        if (colors.length === 0 && (!readsStyling || this.styling)) this.warnScopeEmpty(scope);
        return buildScopeMask(colors, tolerance);
    }

    // An empty scope lights the whole frame, which passes for a working one. The caller skips the
    // warning while the styling module is still on its way.
    private warnScopeEmpty(scope: BloomScope): void {
        if (this.warnedScope) return;

        this.warnedScope = true;
        console.warn(
            `[MapEffects] 'bloom.only: ${scope.join(', ')}' found no colour to key on in the loaded style, so bloom is lighting the whole frame.`,
        );
    }

    // Until the module arrives, named entries key on nothing and bloom lights the whole frame.
    private requestStyling(): void {
        this.stylingRequest ??= StylingModule.get(this.map).then((styling) => {
            this.styling = styling;
            this.dropScopeMask();
        });
    }

    // The redraw is required: an idle map fires no `render`, so the stale glow would stay until the map moved.
    private dropScopeMask(): void {
        this.scopeMask = undefined;
        this.scheduleBloom();
    }

    // ── Capture ───────────────────────────────────────────────────────────────────────────────

    private readBack(): Promise<HTMLCanvasElement> {
        const mapLibreMap = this.map.mapLibreMap;
        return new Promise((resolve) => {
            mapLibreMap.once('render', () => {
                const source = mapLibreMap.getCanvas();
                const values = withDefaults(this.settings);
                const composite = document.createElement('canvas');
                composite.width = source.width;
                composite.height = source.height;
                const context = composite.getContext('2d');
                if (context) {
                    // The same chain the screen is showing, re-run at the capture's own raster —
                    // one implementation rather than a live half and an export half.
                    const stages = this.chainStages(values);
                    context.drawImage(this.chain.render(source, stages) ?? source, 0, 0);
                    compositeEffects(
                        context,
                        source.width,
                        source.height,
                        rasterScaleOf(source),
                        values,
                        this.map.styleLightDarkTheme,
                        this.currentScopeMask(),
                    );
                }
                resolve(composite);
            });
            mapLibreMap.triggerRepaint();
        });
    }

    // Resolves once every source is loaded and every tile drawn at the new ratio, or after a timeout.
    private settled(timeoutMs = 15_000): Promise<void> {
        const mapLibreMap = this.map.mapLibreMap;
        return new Promise((resolve) => {
            const done = () => {
                clearTimeout(timer);
                mapLibreMap.off('idle', done);
                resolve();
            };
            const timer = setTimeout(done, timeoutMs);
            mapLibreMap.once('idle', done);
        });
    }

    private warnIfBufferNotPreserved(): void {
        if (this.warnedBuffer) return;

        const canvas = this.map.mapLibreMap.getCanvas();
        const context = canvas.getContext('webgl2') ?? canvas.getContext('webgl');
        const attributes = context?.getContextAttributes?.();
        if (attributes && !attributes.preserveDrawingBuffer) {
            this.warnedBuffer = true;
            console.warn(
                '[MapEffects] bloom, the depth of field and capture read the map canvas, which needs ' +
                    "`mapLibre: { canvasContextAttributes: { preserveDrawingBuffer: true } }` on the map's options.",
            );
        }
    }

    // ── Validation ────────────────────────────────────────────────────────────────────────────

    private assertKnob(id: string): asserts id is EffectKnobId {
        if (!(id in effectKnobDefinitions)) {
            throw new Error(`Unknown effect knob '${id}'. Call describe() for the catalogue of knob ids.`);
        }
    }

    private validate(id: string, value: unknown): void {
        this.assertKnob(id);
        const definition: EffectKnobDefinition = effectKnobDefinitions[id];
        if (definition.kind === 'colors') {
            if (!Array.isArray(value))
                throw new RangeError(`Knob '${id}' expects a list of colours; got ${String(value)}.`);

            const reason = value.map(invalidScopeEntry).find((invalid) => invalid !== undefined);
            if (reason) throw new RangeError(`Knob '${id}': ${reason}. Call describe() for the names it accepts.`);
            return;
        }
        if (definition.kind === 'color') {
            if (typeof value !== 'string' || !value)
                throw new RangeError(`Knob '${id}' expects a CSS colour; got ${String(value)}.`);
            return;
        }
        const { range } = definition;
        if (typeof value !== 'number' || !Number.isFinite(value)) {
            throw new RangeError(`Knob '${id}' expects a number; got ${String(value)}.`);
        }
        if (value < range.min || value > range.max) {
            throw new RangeError(`Knob '${id}' expects a number between ${range.min} and ${range.max}; got ${value}.`);
        }
    }
}
