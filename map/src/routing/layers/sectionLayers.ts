import type { ExpressionSpecification, LineLayerSpecification, SymbolLayerSpecification } from 'maplibre-gl';
import type { LayerSpecTemplate } from '../../shared';
import { MAP_BOLD_FONT } from '../../shared/layers/commonLayerProps';
import { darkenColor } from '../../utils/colorUtils';
import type {
    RouteWidth,
    SectionDisplayConfig,
    SectionLineLayerName,
    SectionSignLayerName,
    SectionSignPlacement,
    SectionSignPriority,
    SectionSymbolLayerName,
} from '../types/routeModuleConfig';
import type {
    BandedSectionType,
    DrawnSectionType,
    GeneratedSectionType,
    SectionDrawStyle,
    SectionLinePattern,
    SignPostingSectionType,
} from './sectionRegistry';
import { SECTION_REGISTRY, sectionEntry, sectionSupportsKnob } from './sectionRegistry';
import { getLineForegroundWidth, getSectionHaloWidth, SELECTED_ROUTE_FILTER } from './shared';

// Colours for the sections that band the route, chosen to be distinguishable from each other and
// from the main route line. They live here rather than in the registry so the knob catalogue can
// read the default off the built layer and cannot report a colour the layer does not use.
const GENERATED_SECTION_PAINT: Record<BandedSectionType, { color: string; opacity: number }> = {
    carpool: { color: '#6D4AC7', opacity: 0.55 },
    carTrain: { color: '#8A5A2B', opacity: 0.6 },
    importantRoadStretch: { color: '#C7761F', opacity: 0.6 },
    lowEmissionZone: { color: '#2E8B57', opacity: 0.5 },
    motorway: { color: '#1F6FB2', opacity: 0.4 },
    pedestrian: { color: '#B23F86', opacity: 0.6 },
    tollVignette: { color: '#8C6B1F', opacity: 0.55 },
    unpaved: { color: '#7A6A54', opacity: 0.6 },
    urban: { color: '#7E8C8E', opacity: 0.3 },
};

const DASH_ARRAYS: Record<SectionLinePattern, [number, number] | undefined> = {
    solid: undefined,
    dashed: [2, 1.5],
    dotted: [0, 1.5],
};

/**
 * Which line of a multi-line section a spec draws, and so what `sections.<type>.color` means for it.
 *
 * @remarks
 * `principal` takes the configured colour as given; `outline` derives a darker shade of it, the
 * same way the main route line derives its own outline.
 * @ignore
 */
export type SectionLineRole = 'principal' | 'outline';

/**
 * Whether the given type is drawn, per its configuration or its own default.
 * @ignore
 */
export const isSectionVisible = (type: DrawnSectionType, config?: SectionDisplayConfig): boolean =>
    config?.visible ?? SECTION_REGISTRY[type].visible;

/**
 * How the given type is drawn against the route line, per its configuration or its own default.
 *
 * @remarks
 * `undefined` for a type that posts a sign, which draws no line to relate to the route.
 * @ignore
 */
export const sectionDrawStyle = (type: DrawnSectionType, config?: SectionDisplayConfig): SectionDrawStyle | undefined =>
    (sectionSupportsKnob(type, 'style') && config?.style) || sectionEntry(type).style;

// The route layer each draw style anchors its sections beneath. `routeDeselectedOutline` is the
// bottom of the route's own stack, so a halo lands under every line the route draws; a section
// inserted beneath `routeLineArrows` covers the route line and leaves the arrows on top of it.
const SECTION_STYLE_ANCHOR: Record<SectionDrawStyle, string> = {
    halo: 'routeDeselectedOutline',
    inline: 'routeLineArrows',
};

/**
 * The route layer a section of the given type is inserted beneath.
 *
 * @remarks
 * The draw style decides this: a band around the route has to sit under the route's lines, and a
 * section that stands in for the route line has to sit over them. Types drawn with several lines
 * anchor their topmost line here and chain the rest to it, so the group moves as one.
 * @ignore
 */
export const sectionStyleAnchor = (type: DrawnSectionType, config?: SectionDisplayConfig): string | undefined => {
    const drawStyle = sectionDrawStyle(type, config);
    return drawStyle && SECTION_STYLE_ANCHOR[drawStyle];
};

// The pattern belongs to the line the eye reads as the section. On a type drawn with two, the
// outline stays solid so it remains the continuous halo the dashes sit on.
const applyLinePatternKnob = (
    type: DrawnSectionType,
    paint: NonNullable<LineLayerSpecification['paint']>,
    config?: SectionDisplayConfig,
): void => {
    const pattern = config?.pattern ?? sectionEntry(type).pattern;
    const dashArray = pattern && DASH_ARRAYS[pattern];
    if (dashArray) {
        paint['line-dasharray'] = dashArray;
        return;
    }

    delete paint['line-dasharray'];
};

/**
 * Applies the uniform section knobs to one line layer of a section.
 *
 * @remarks
 * The one place the semantic tier turns into paint, for all sixteen drawn types: the hand-written
 * layers of the bespoke types pass through here just as the generated ones do, which is what lets
 * `sections.tunnel.color` and `sections.urban.color` mean the same thing.
 *
 * A knob the type does not carry is left alone rather than defaulted over — `traffic` keeps the
 * dash pattern that encodes incident severity, because it offers no `pattern` knob to override it
 * with.
 * @ignore
 */
export const withSectionLineKnobs = (
    type: DrawnSectionType,
    spec: LayerSpecTemplate<LineLayerSpecification>,
    config?: SectionDisplayConfig,
    routeWidth?: RouteWidth,
    role: SectionLineRole = 'principal',
): LayerSpecTemplate<LineLayerSpecification> => {
    const width = config?.width ?? routeWidth;
    const paint: LineLayerSpecification['paint'] = {
        ...spec.paint,
        'line-width':
            sectionDrawStyle(type, config) === 'halo' ? getSectionHaloWidth(width) : getLineForegroundWidth(width),
    };

    if (config?.color && sectionSupportsKnob(type, 'color')) {
        const configuredColor = role === 'outline' ? darkenColor(config.color, 0.4) : config.color;
        if (configuredColor) paint['line-color'] = configuredColor;
    }

    if (config?.opacity !== undefined && sectionSupportsKnob(type, 'opacity')) {
        paint['line-opacity'] = config.opacity;
    }

    if (role === 'principal' && sectionSupportsKnob(type, 'pattern')) applyLinePatternKnob(type, paint, config);

    return {
        ...spec,
        layout: {
            ...spec.layout,
            ...(!isSectionVisible(type, config) && { visibility: 'none' }),
        },
        paint,
    };
};

/**
 * Applies the uniform section knobs to one symbol layer of a section.
 *
 * @remarks
 * The icon knob replaces the image on a section that already draws one, so `ferry` and `tollRoad`
 * take the same `sections.<type>.icon` as the generated types that have one added for them.
 * @ignore
 */
export const withSectionSymbolKnobs = (
    type: DrawnSectionType,
    spec: LayerSpecTemplate<SymbolLayerSpecification>,
    config?: SectionDisplayConfig,
): LayerSpecTemplate<SymbolLayerSpecification> => {
    const icon = sectionSupportsKnob(type, 'icon') ? config?.icon : undefined;
    return {
        ...spec,
        layout: {
            ...spec.layout,
            ...(icon && {
                'icon-image': icon.image,
                'icon-size': icon.size ?? 1,
                ...(icon.placement && {
                    'symbol-placement': icon.placement === 'along' ? 'line' : 'line-center',
                }),
            }),
            ...(!isSectionVisible(type, config) && { visibility: 'none' }),
        },
    };
};

/**
 * Builds the line layer of one generated section that bands the route.
 * @ignore
 */
export const sectionLine = (
    type: BandedSectionType,
    config?: SectionDisplayConfig,
    routeWidth?: RouteWidth,
): LayerSpecTemplate<LineLayerSpecification> =>
    withSectionLineKnobs(
        type,
        {
            filter: SELECTED_ROUTE_FILTER,
            type: 'line',
            // Round caps are what turn the zero-length dashes of the `dotted` pattern into dots;
            // with butt caps they render as slivers.
            layout: { 'line-cap': 'round', 'line-join': 'round' },
            paint: {
                'line-color': GENERATED_SECTION_PAINT[type].color,
                'line-opacity': GENERATED_SECTION_PAINT[type].opacity,
            },
        },
        config,
        routeWidth,
    );

/**
 * Builds the icon layer of one generated section, for a configuration that asks for an icon.
 *
 * @remarks
 * A section is a stretch of line, so the icon goes either once at its centre or repeatedly along
 * it: MapLibre places symbols on a line no other way.
 * @ignore
 */
export const sectionSymbol = (
    type: GeneratedSectionType,
    config: SectionDisplayConfig,
): LayerSpecTemplate<SymbolLayerSpecification> | undefined => {
    if (!config.icon || !sectionSupportsKnob(type, 'icon')) return undefined;

    return withSectionSymbolKnobs(
        type,
        {
            filter: SELECTED_ROUTE_FILTER,
            type: 'symbol',
            layout: {
                'symbol-placement': 'line-center',
                // The caller asked for these icons, so they win over whatever the basemap wanted
                // to put in the same place, and they stay upright as the map rotates.
                'icon-allow-overlap': true,
                'icon-rotation-alignment': 'viewport',
            },
        },
        config,
    );
};

/**
 * The zoom a speed limit sign starts drawing at, which is the bottom of {@link SIGN_ICON_SIZE}'s
 * ramp. Further out, neighbouring stretches fall in the same few pixels, so the handful that
 * survive the collision are an arbitrary sample of the drive.
 */
const SIGN_DEFAULT_MINZOOM = 10;

/**
 * Screen pixels between one sign and the next along a stretch, under `along` placement.
 *
 * Wide enough that a run of them reads as the same limit repeated rather than as a row of separate
 * facts, and close enough that a reader zoomed into a long stretch still has one in view.
 */
const SIGN_SPACING = 260;

// A sign grows with the zoom, the way the ferry and toll-road icons do. It stays smaller than a
// waypoint pin at every zoom: a limit is context for the road, not a place on it.
const SIGN_ICON_SIZE: ExpressionSpecification = ['interpolate', ['linear'], ['zoom'], 10, 0.5, 16, 0.7];

// The number scales with the face it sits on: small enough not to crowd the ring, large enough
// that three digits are still legible at the zoom the signs start drawing at.
const SIGN_TEXT_SIZE: ExpressionSpecification = ['interpolate', ['linear'], ['zoom'], 10, 9, 16, 13];

/**
 * Which signs win the space when two fall in it: the longest stretches first.
 *
 * MapLibre places a layer's symbols in ascending sort key, and the first placed keeps its spot. A
 * section's length in points is the best proxy available for how much of the drive its limit
 * governs, so negating it puts the governing limits on the map and drops the incidental ones —
 * rather than letting the order features happen to arrive in decide.
 */
const SIGN_SORT_KEY: ExpressionSpecification = ['-', ['get', 'startPointIndex'], ['get', 'endPointIndex']];

// Where the number sits on its face. A disc is empty, so the number takes the middle; a plaque
// prints its own words across the top, so the number goes below them or lands on top of "LIMIT".
// Offsets are in ems of the text size, so they hold as the sign scales.
const SIGN_TEXT_OFFSET: ExpressionSpecification = [
    'case',
    ['==', ['get', 'signFace'], 'plaque'],
    ['literal', [0, 0.55]],
    ['literal', [0, 0]],
];

const signPlacement = (config?: SectionDisplayConfig): SectionSignPlacement => config?.sign?.placement ?? 'atChange';

/**
 * What a section type's signs give way to: the configured `sign.priority`, or the default of the
 * placement in force.
 *
 * @ignore
 */
export const signPriority = (config?: SectionDisplayConfig): SectionSignPriority =>
    config?.sign?.priority ?? (signPlacement(config) === 'atChange' ? 'belowRouteIcons' : 'belowMapLabels');

/**
 * How the sign layer is anchored, per the placement it is drawn for.
 *
 * @remarks
 * Both read the section's own line, so this is the whole of the difference. MapLibre anchors a
 * symbol on a line at its **first vertex** under `point` placement, which is where the section
 * starts and so where its value begins to apply.
 */
const signAnchorLayout = (
    placement: SectionSignPlacement,
): Pick<NonNullable<SymbolLayerSpecification['layout']>, 'symbol-placement' | 'symbol-spacing'> =>
    placement === 'atChange'
        ? { 'symbol-placement': 'point' }
        : { 'symbol-placement': 'line', 'symbol-spacing': SIGN_SPACING };

/**
 * Builds the sign layer of a section type whose information is its own number rather than the
 * stretch it covers, which is the whole of what that type draws.
 *
 * @remarks
 * The face and the number both come from the feature, so one layer draws every country's sign.
 *
 * Overlap stays disallowed. A route splits into a section wherever its geometry does, so a route
 * can carry over a hundred speed limit sections, and MapLibre then keeps the signs that fit.
 * @ignore
 */
export const sectionSign = (
    type: SignPostingSectionType,
    config?: SectionDisplayConfig,
): LayerSpecTemplate<SymbolLayerSpecification> => {
    return {
        filter: SELECTED_ROUTE_FILTER,
        type: 'symbol',
        minzoom: config?.sign?.minzoom ?? SIGN_DEFAULT_MINZOOM,
        layout: {
            ...signAnchorLayout(signPlacement(config)),
            'icon-image': ['get', 'signImageID'],
            'icon-size': SIGN_ICON_SIZE,
            'icon-rotation-alignment': 'viewport',
            'text-field': ['get', 'signLabel'],
            'text-font': [MAP_BOLD_FONT],
            'text-size': SIGN_TEXT_SIZE,
            'text-offset': SIGN_TEXT_OFFSET,
            'text-rotation-alignment': 'viewport',
            'symbol-sort-key': SIGN_SORT_KEY,
            ...(!isSectionVisible(type, config) && { visibility: 'none' }),
        },
        // The numerals are the country's too — near-black almost everywhere, blue in Japan.
        paint: { 'text-color': ['get', 'signNumeralsColor'] },
    };
};

// One naming scheme for every generated section layer, so the ids the module adds and the keys a
// `layers.sections` override reaches them by cannot diverge.
const sectionLayerID = <T extends GeneratedSectionType, K extends string>(
    type: T,
    kind: K,
): `routeSection${Capitalize<T>}${K}` =>
    `routeSection${(type.charAt(0).toUpperCase() + type.slice(1)) as Capitalize<T>}${kind}`;

/**
 * The MapLibre layer id of a generated section's line layer, before any instance prefix.
 * @ignore
 */
export const sectionLineLayerID = <T extends GeneratedSectionType>(type: T): SectionLineLayerName<T> =>
    sectionLayerID(type, 'Line');

/**
 * The MapLibre layer id of a generated section's icon layer, before any instance prefix.
 * @ignore
 */
export const sectionSymbolLayerID = <T extends GeneratedSectionType>(type: T): SectionSymbolLayerName<T> =>
    sectionLayerID(type, 'Symbol');

/**
 * The MapLibre layer id of a generated section's sign layer, before any instance prefix.
 * @ignore
 */
export const sectionSignLayerID = <T extends GeneratedSectionType>(type: T): SectionSignLayerName<T> =>
    sectionLayerID(type, 'Sign');
