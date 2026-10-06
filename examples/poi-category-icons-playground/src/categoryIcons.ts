import type { CustomImage, MapStylePOICategory } from '@tomtom-org/maps-sdk/map';
import cafeGlyph from './glyphs/cafe.svg?raw';
import hotelGlyph from './glyphs/hotel.svg?raw';
import museumGlyph from './glyphs/museum.svg?raw';
import parkingGlyph from './glyphs/parking.svg?raw';
import restaurantGlyph from './glyphs/restaurant.svg?raw';

type Shape = {
    label: string;
    // Image pixels, drawn at the SDK's default pixel ratio of 2
    width: number;
    height: number;
    outline: string;
    // The square the category's glyph is drawn in
    glyphBox: { x: number; y: number; size: number };
    // The shape marks its place with a tip at its bottom, rather than with its centre
    tipAtBottom?: boolean;
};

const PIXEL_RATIO = 2;

const shapeIDs = ['circle', 'square', 'diamond', 'pin'] as const;
type ShapeID = (typeof shapeIDs)[number];

const shapes: Record<ShapeID, Shape> = {
    circle: {
        label: 'Circle',
        width: 52,
        height: 52,
        outline: 'M26 3a23 23 0 1 1 0 46a23 23 0 1 1 0-46z',
        glyphBox: { x: 14, y: 14, size: 24 },
    },
    square: {
        label: 'Square',
        width: 52,
        height: 52,
        outline: 'M13 3h26a10 10 0 0 1 10 10v26a10 10 0 0 1-10 10H13A10 10 0 0 1 3 39V13A10 10 0 0 1 13 3z',
        glyphBox: { x: 14, y: 14, size: 24 },
    },
    diamond: {
        label: 'Diamond',
        width: 60,
        height: 60,
        outline: 'M30 3 57 30 30 57 3 30z',
        glyphBox: { x: 18, y: 18, size: 24 },
    },
    pin: {
        label: 'Pin',
        width: 52,
        height: 68,
        outline: 'M26 66C20 52 3 44 3 26a23 23 0 0 1 46 0c0 18-17 26-23 40z',
        glyphBox: { x: 14, y: 14, size: 24 },
        tipAtBottom: true,
    },
};

// `map` keeps the icon the map style draws the category with
export type IconLook = 'map' | ShapeID;
export const iconLooks: IconLook[] = ['map', ...shapeIDs];
export const lookLabel = (look: IconLook): string => (look === 'map' ? 'Map icon' : shapes[look].label);

export type CategoryStyle = { look: IconLook; color: string };

export type PanelCategory = {
    // The map tells cafés and coffee shops apart: one row can style several of its categories
    ids: MapStylePOICategory[];
    label: string;
    glyph: string;
    initialStyle: CategoryStyle;
};

export const categories: PanelCategory[] = [
    {
        ids: ['RESTAURANT'],
        label: 'Restaurants',
        glyph: restaurantGlyph,
        initialStyle: { look: 'circle', color: '#e8590c' },
    },
    {
        ids: ['CAFE_PUB', 'COFFEE_SHOP'],
        label: 'Cafés',
        glyph: cafeGlyph,
        initialStyle: { look: 'square', color: '#8b5e3c' },
    },
    {
        ids: ['HOTEL_OR_MOTEL'],
        label: 'Hotels',
        glyph: hotelGlyph,
        initialStyle: { look: 'pin', color: '#5b4fc4' },
    },
    {
        ids: ['MUSEUM'],
        label: 'Museums',
        glyph: museumGlyph,
        initialStyle: { look: 'diamond', color: '#0b7a75' },
    },
    {
        ids: ['PARKING_GARAGE'],
        label: 'Parking',
        glyph: parkingGlyph,
        initialStyle: { look: 'map', color: '#1e6fd9' },
    },
];

// The glyph assets draw in `currentColor`: white over the shape
const placeGlyph = (glyph: string, { x, y, size }: Shape['glyphBox']): string =>
    glyph.replace('<svg ', `<svg x="${x}" y="${y}" width="${size}" height="${size}" color="#fff" `);

const shapeImage = (glyph: string, { width, height, outline, glyphBox }: Shape, color: string): string =>
    `<svg xmlns="http://www.w3.org/2000/svg" width="${width}" height="${height}" viewBox="0 0 ${width} ${height}">` +
    `<path d="${outline}" fill="${color}" stroke="#fff" stroke-width="3" stroke-linejoin="round"/>` +
    `${placeGlyph(glyph, glyphBox)}</svg>`;

/**
 * The SVG of a category's glyph in the shape and colour of its style, or none to keep the map style's icon.
 */
export const toCategoryImage = ({ glyph }: PanelCategory, { look, color }: CategoryStyle): string | undefined =>
    look === 'map' ? undefined : shapeImage(glyph, shapes[look], color);

/**
 * The entries a row's categories take in `categoryIcons`, none to keep the map style's icons.
 */
export const toCategoryIcons = (
    { ids, glyph }: PanelCategory,
    { look, color }: CategoryStyle,
): CustomImage<MapStylePOICategory>[] => {
    if (look === 'map') return [];

    const shape = shapes[look];
    const image = shapeImage(glyph, shape, color);
    // Icons are centred on the place: a shape with a tip moves up half its height, in screen pixels, for the tip to stand on it
    const offsetY = shape.tipAtBottom ? -shape.height / 2 / PIXEL_RATIO : undefined;
    return ids.map((id) => ({ id, image, offsetY }));
};
