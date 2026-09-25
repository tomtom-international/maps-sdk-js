/**
 * Recolouring style values while keeping their shape and their shade relationships.
 *
 * A semantic colour reaches many literals the style derived from one base: the motorway line, the
 * trunk a shade lighter, the outline darker, the tunnel washed out. Recolouring picks the literal
 * standing for that base (the *anchor*), measures every other literal's HSL offset from it, and
 * re-derives them all from the new colour at those offsets — so the style is its own manifest.
 *
 * @module
 * @ignore
 */

import {
    GREY_SATURATION,
    type HslShift,
    hslShiftBetween,
    hueDistance,
    isOpaqueColorLiteral,
    shiftHsl,
    toHsl,
} from '../utils/colorUtils';
import { isLegacyFunction } from './expressionTransforms';

/** Road classes the `roadMajor` colour governs; every other class is `road`. */
const MAJOR_ROAD_CLASSES = new Set(['motorway', 'trunk', 'primary']);

/**
 * Which side of the major/minor road split a literal sits on.
 * @ignore
 */
export type RoadClass = 'major' | 'minor';

/**
 * A road class as read off the expression a literal sits in; `undefined` outside a `match` on the
 * feature's road class.
 * @ignore
 */
export type RoadClassContext = RoadClass | undefined;

/**
 * Whether a semantic colour owns a literal, given the road class context the literal sits in.
 * @ignore
 */
export type LiteralOwnership = (roadClass: RoadClassContext) => boolean;

const isMatchOnRoadClass = (node: unknown[]): boolean =>
    node[0] === 'match' &&
    Array.isArray(node[1]) &&
    node[1][0] === 'get' &&
    (node[1][1] === 'category' || node[1][1] === 'road_category');

const roadClassOfKeys = (keys: unknown): RoadClassContext => {
    const list = Array.isArray(keys) ? keys : [keys];
    return list.some((key) => typeof key === 'string' && MAJOR_ROAD_CLASSES.has(key)) ? 'major' : 'minor';
};

type Visitor = (literal: string, roadClass: RoadClassContext) => string;

// Replaces every opaque colour literal in a style value — expression or legacy function — through
// the visitor, which is told the road class whenever the literal sits inside a match on one.
const mapColorLiterals = (value: unknown, visit: Visitor, roadClass: RoadClassContext = undefined): unknown => {
    if (isOpaqueColorLiteral(value)) return visit(value, roadClass);

    if (Array.isArray(value)) {
        if (isMatchOnRoadClass(value)) {
            // ['match', input, key(s), output, key(s), output, …, fallback]
            const result = [value[0], value[1]];
            for (let index = 2; index < value.length - 1; index += 2) {
                result.push(value[index], mapColorLiterals(value[index + 1], visit, roadClassOfKeys(value[index])));
            }
            result.push(mapColorLiterals(value[value.length - 1], visit, 'minor'));
            return result;
        }
        return value.map((item) => mapColorLiterals(item, visit, roadClass));
    }
    if (isLegacyFunction(value)) {
        return {
            ...value,
            stops: value.stops.map(([input, output]) => [input, mapColorLiterals(output, visit, roadClass)]),
        };
    }
    return value;
};

/**
 * Every opaque colour literal in a style value, with its road class context.
 * @ignore
 */
export const collectColorLiterals = (value: unknown): { literal: string; roadClass: RoadClassContext }[] => {
    const found: { literal: string; roadClass: RoadClassContext }[] = [];
    mapColorLiterals(value, (literal, roadClass) => {
        found.push({ literal, roadClass });
        return literal;
    });
    return found;
};

/**
 * The literal standing for a semantic colour: the most saturated one it owns, ties broken by order,
 * so a glacier's pale wash never outvotes the water beside it.
 * @ignore
 */
export const pickAnchorLiteral = (value: unknown, owns: LiteralOwnership = () => true): string | undefined => {
    let best: { literal: string; saturation: number } | undefined;
    for (const { literal, roadClass } of collectColorLiterals(value)) {
        if (!owns(roadClass)) continue;

        const saturation = toHsl(literal)?.[1] ?? 0;
        if (!best || saturation > best.saturation) best = { literal, saturation };
    }
    return best?.literal;
};

// Further than this from the anchor's hue and a literal is a tint of its own — a hospital's pink
// under the built-up beige — rather than a shade of the semantic colour.
const HUE_FAMILY_DEGREES = 40;

// The offset that re-derives one shade, or `undefined` when the literal is no shade of the anchor:
// greys are shades of anything, coloured literals only of an anchor in their own hue family. A
// near-grey's hue is noise, so it takes the new colour's hue rather than the offset between two
// arbitrary ones.
const shadeShift = (anchorColor: string, literal: string): HslShift | undefined => {
    const anchor = toHsl(anchorColor);
    const shade = toHsl(literal);
    if (!anchor || !shade) return undefined;

    const grey = anchor[1] < GREY_SATURATION || shade[1] < GREY_SATURATION;
    if (!grey && hueDistance(anchor[0], shade[0]) > HUE_FAMILY_DEGREES) return undefined;

    const shift = hslShiftBetween(anchorColor, literal);
    return shift && (grey ? { ...shift, hue: 0 } : shift);
};

/**
 * One semantic colour's claim on the literals of a style value: where its shades are measured from,
 * what to re-derive them into, and which of them it owns.
 * @ignore
 */
export type MapColorBid = {
    anchorColor: string;
    newColor: string;
    owns?: LiteralOwnership;
};

/**
 * Re-derives the style's own value through every colour bidding for it, keeping each literal's HSL
 * offset from that colour's anchor. Literals outside a bid's hue family are tints in their own
 * right, left as they are.
 *
 * Every literal is judged against `originalValue`, never against what an earlier bid wrote, so two
 * colours reaching one layer — the tunnel drawing both road classes, the bridge shading from land
 * into built-up — compose instead of the second re-deriving the first's output. Where both own one
 * literal the last bid wins outright.
 * @ignore
 */
export const recolorValue = (originalValue: unknown, bids: MapColorBid[]): unknown => {
    const lastFirst = [...bids].reverse();
    return mapColorLiterals(originalValue, (literal, roadClass) => {
        for (const { anchorColor, newColor, owns } of lastFirst) {
            if (owns && !owns(roadClass)) continue;

            const shift = shadeShift(anchorColor, literal);
            if (shift) return shiftHsl(newColor, shift) ?? literal;
        }
        return literal;
    });
};
