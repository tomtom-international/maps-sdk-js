import type {
    FilterablePOICategory,
    MapColors,
    StandardStyleID,
    TerrainHillshadeConfig,
} from '@tomtom-org/maps-sdk/map';
import { keysOf } from '../keysOf';

/** Everything the Map panel sets, as one value: a preset is one of these, and each control edits one field. */
export type MapLook = {
    style: StandardStyleID;
    /** A palette laid over the style. Unset, the style's own colours. */
    theme?: ThemeId;
    labelSize: number;
    roadWidth: number;
    trafficFlow: boolean;
    trafficIncidents: boolean;
    buildings3D: boolean;
    pois: POIFocusId;
    /** Unset, no relief shading. */
    hillshade?: HillshadeLookId;
    terrain: boolean;
    exaggeration: number;
};

export const defaultLook: MapLook = {
    style: 'streetLight',
    labelSize: 1,
    roadWidth: 1,
    trafficFlow: false,
    trafficIncidents: false,
    buildings3D: false,
    pois: 'all',
    // The trips cross the Alps: shaded from above and raised in the fly-over, the relief reads every
    // climb and pass on the way.
    hillshade: 'styleDefault',
    terrain: true,
    exaggeration: 1.5,
};

export const styleLabels: Record<StandardStyleID, string> = {
    streetLight: 'Street light',
    streetDark: 'Street dark',
    streetLightDriving: 'Driving light',
    streetDarkDriving: 'Driving dark',
    monoLight: 'Mono light',
    monoDark: 'Mono dark',
    streetSatellite: 'Satellite',
};

export type LookSwatch = Required<Pick<MapColors, 'land' | 'water' | 'road' | 'roadMajor' | 'accent'>>;

/** Approximate colours of each style, for its thumbnail. */
const styleSwatches: Record<StandardStyleID, Omit<LookSwatch, 'accent'>> = {
    streetLight: { land: '#f4f2ee', water: '#a9d3f5', road: '#ffffff', roadMajor: '#f7c948' },
    streetDark: { land: '#2b2f36', water: '#1d3349', road: '#4a505a', roadMajor: '#8a7a4a' },
    streetLightDriving: { land: '#eef0f2', water: '#b9d4ea', road: '#ffffff', roadMajor: '#f2a33a' },
    streetDarkDriving: { land: '#1d2229', water: '#13263a', road: '#3b424c', roadMajor: '#c88a2c' },
    monoLight: { land: '#f2f2f2', water: '#d6dde3', road: '#ffffff', roadMajor: '#cfcfcf' },
    monoDark: { land: '#2a2a2a', water: '#1b1f24', road: '#444444', roadMajor: '#5a5a5a' },
    streetSatellite: { land: '#56653f', water: '#1f3b4d', road: '#d9d2bc', roadMajor: '#f2d38a' },
};

type Theme = {
    label: string;
    /** The styles whose lightness the palette keeps, so the style's derived shades stay readable. */
    styles: StandardStyleID[];
    /** `accent` recolours the route and pins too. A mono style derives the rest from `land`. */
    colors: MapColors;
};

export const themes = {
    paper: {
        label: 'Paper',
        styles: ['streetLight', 'streetLightDriving'],
        colors: {
            land: '#f5efe3',
            water: '#a8c8d6',
            vegetation: '#d4dfbf',
            park: '#c5d9a8',
            artificial: '#ebe2d3',
            roadMajor: '#f2b76b',
            road: '#ffffff',
            roadOutline: '#d8ccb8',
            label: '#4a4237',
            labelHalo: '#fbf7ef',
            accent: '#b4532a',
        },
    },
    evergreen: {
        label: 'Evergreen',
        styles: ['streetLight', 'streetLightDriving'],
        colors: {
            land: '#f2f6f1',
            water: '#a6d6d4',
            vegetation: '#c9e4c3',
            park: '#b5dcaa',
            roadMajor: '#cfd8de',
            road: '#ffffff',
            label: '#1f3b2c',
            accent: '#00a35c',
        },
    },
    slate: { label: 'Slate', styles: ['monoLight'], colors: { land: '#eef1f4', accent: '#e8710a' } },
    sand: { label: 'Sand', styles: ['monoLight'], colors: { land: '#f4eee4', accent: '#2463eb' } },
    blueprint: { label: 'Blueprint', styles: ['monoDark'], colors: { land: '#0f2742', accent: '#5ad1ff' } },
    amberNight: {
        label: 'Amber night',
        styles: ['streetDark', 'streetDarkDriving'],
        colors: { land: '#12161d', water: '#0f2433', roadMajor: '#c98a2c', accent: '#ffb547' },
    },
} satisfies Record<string, Theme>;

export type ThemeId = keyof typeof themes;

/** The palettes made for a style. */
export const themesFor = (style: StandardStyleID): ThemeId[] =>
    keysOf(themes).filter((id) => {
        const { styles }: Theme = themes[id];
        return styles.includes(style);
    });

export const hillshadeLooks = {
    // Violet shadows and warm light, after the Swiss school of relief shading.
    swissRelief: {
        label: 'Swiss relief',
        hillshade: {
            method: 'multidirectional',
            light: { direction: 315, altitude: 45 },
            intensity: 0.35,
            colors: { shaded: '#a49dd6', lit: '#fff1cc', steep: '#7a5c45' },
        },
    },
    etching: {
        label: 'Etching',
        hillshade: { method: 'igor', intensity: 0.5, colors: { shaded: '#4a3522', lit: '#f6e7c8', steep: '#2a1d12' } },
    },
    winterSun: {
        label: 'Low winter sun',
        hillshade: {
            method: 'basic',
            light: { direction: 290, altitude: 15 },
            intensity: 0.35,
            colors: { shaded: '#6584b0', lit: '#ffd9a8' },
        },
    },
    // Made for the dark styles: lit ridges over unlit valleys.
    nightRidge: {
        label: 'Night ridge',
        hillshade: {
            method: 'multidirectional',
            light: { altitude: 50 },
            intensity: 0.35,
            colors: { shaded: '#000000', lit: '#7fd4ff', steep: '#0b1d3a' },
        },
    },
    styleDefault: { label: 'Style default', hillshade: { intensity: 0.5 } },
} satisfies Record<string, { label: string; hillshade: TerrainHillshadeConfig }>;

export type HillshadeLookId = keyof typeof hillshadeLooks;

export const hillshadeLookIds = keysOf(hillshadeLooks);

/** Which of the map's own POIs to show. Unset `categories` shows them all. */
export type POIFocus = { label: string; categories?: FilterablePOICategory[] };

export const poiFocuses = {
    all: { label: 'All places' },
    driving: {
        label: 'Fuel, charging and parking',
        categories: ['GAS_STATIONS_GROUP', 'EV_CHARGING_STATIONS_GROUP', 'PARKING_GROUP'],
    },
    charging: { label: 'EV charging', categories: ['EV_CHARGING_STATIONS_GROUP'] },
    trucks: {
        label: 'Truck stops, fuel and rest areas',
        categories: ['TRUCK_STOP', 'GAS_STATIONS_GROUP', 'REST_AREA'],
    },
    food: { label: 'Food and sights', categories: ['FOOD_DRINKS_GROUP', 'HOLIDAY_TOURISM_GROUP'] },
    stay: { label: 'Places to stay', categories: ['ACCOMMODATION_GROUP'] },
    outdoors: { label: 'Sights and outdoors', categories: ['HOLIDAY_TOURISM_GROUP', 'SPORTS_LEISURE_GROUP'] },
    none: { label: 'None' },
} satisfies Record<string, POIFocus>;

export type POIFocusId = keyof typeof poiFocuses;

export const poiFocusIds = keysOf(poiFocuses);

export type MapPreset = {
    id: string;
    label: string;
    description: string;
    look: MapLook;
};

const preset = (fields: Omit<MapPreset, 'look'>, look: Partial<MapLook>): MapPreset => ({
    ...fields,
    look: { ...defaultLook, ...look },
});

export const mapPresets: MapPreset[] = [
    preset(
        {
            id: 'everyday',
            label: 'Everyday',
            description: 'The standard street map',
        },
        {},
    ),
    preset(
        {
            id: 'rush-hour',
            label: 'Rush hour',
            description: 'Live traffic over a quiet map',
        },
        { style: 'monoLight', trafficFlow: true, trafficIncidents: true, pois: 'none' },
    ),
    preset(
        {
            id: 'night-drive',
            label: 'Night drive',
            description: 'Dark, with bigger labels and wider roads',
        },
        {
            style: 'streetDarkDriving',
            theme: 'amberNight',
            labelSize: 1.2,
            roadWidth: 1.2,
            pois: 'driving',
            trafficIncidents: true,
        },
    ),
    preset(
        {
            id: 'ev-trip',
            label: 'EV road trip',
            description: 'Chargers only, on a fresh green map',
        },
        { theme: 'evergreen', pois: 'charging' },
    ),
    preset(
        {
            id: 'truck',
            label: 'Truck and logistics',
            description: 'Wide roads, truck stops and incidents',
        },
        { style: 'monoLight', theme: 'slate', labelSize: 1.1, roadWidth: 1.3, pois: 'trucks', trafficIncidents: true },
    ),
    preset(
        {
            id: 'scenic',
            label: 'Scenic drive',
            description: 'Warm paper tones and soft relief',
        },
        { theme: 'paper', hillshade: 'swissRelief', pois: 'outdoors' },
    ),
    preset(
        {
            id: 'mountains',
            label: 'Mountain passes',
            description: 'Satellite imagery, with no places pinned over it',
        },
        { style: 'streetSatellite', pois: 'none' },
    ),
    preset(
        {
            id: 'city-trip',
            label: 'City trip',
            description: '3D buildings, food and sights',
        },
        { buildings3D: true, labelSize: 1.1, pois: 'food' },
    ),
    preset(
        {
            id: 'overview',
            label: 'Trip overview',
            description: 'A quiet base so the whole route reads at a glance',
        },
        { style: 'monoLight', theme: 'sand', labelSize: 0.9, roadWidth: 0.8, pois: 'none' },
    ),
    preset(
        {
            id: 'blueprint',
            label: 'Blueprint',
            description: 'Dark mono with lit ridges',
        },
        { style: 'monoDark', theme: 'blueprint', hillshade: 'nightRidge', pois: 'none' },
    ),
];

const routeBlue = '#3f9cd9';

/** The colours a look's thumbnail draws: the style's, under whatever its palette sets. */
export const lookSwatch = ({ style, theme }: Pick<MapLook, 'style' | 'theme'>): LookSwatch => ({
    ...styleSwatches[style],
    accent: routeBlue,
    ...(theme && themes[theme].colors),
});

const lookKeys = keysOf<keyof MapLook>({ ...defaultLook, theme: undefined, hillshade: undefined });

export const sameLook = (first: MapLook, second: MapLook): boolean =>
    lookKeys.every((key) => first[key] === second[key]);
