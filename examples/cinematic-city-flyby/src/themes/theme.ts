import type { CustomTypeface, MapLight, StandardStyleID } from '@tomtom-org/maps-sdk/map';
import type { Buildings3DConfig, GLSurfacesConfig, Landmarks3DConfig } from '@tomtom-org/maps-sdk-plugin-landmarks-3d';
import type { MapEffectsConfig, MapEffectsPass } from '@tomtom-org/maps-sdk-plugin-map-effects';
import type { MapThemeMode } from '@tomtom-org/maps-sdk-plugin-map-theme';

/** The heading a look is listed under. The Theme menu keeps each run of one heading together. */
export type FlybyThemeGroup = 'Natural light' | 'Camera and film' | 'Print and paper' | 'Neon and night';

/** A look for the whole scene: the map's colours, its sky and labels, the buildings and their light, and the effects over the frame. */
export type FlybyTheme = {
    /** The name a fly-by picks its opening look by. The menu lists these in `flybyThemes` order. */
    label: string;
    group: FlybyThemeGroup;
    style: StandardStyleID;
    /** The colours the map's ten are derived from. */
    theme: { colors: string[]; mode: MapThemeMode };
    /** The sky overhead, and a glow towards the horizon; the horizon itself fades into the map's land. */
    sky: { color: string; horizon?: string };
    /** The open source typeface the map's labels are set in. */
    font: CustomTypeface;
    /**
     * Where the sun stands, in degrees: set once on the map's light, which lights the buildings, the
     * landmarks and the textured ground alike.
     */
    sun: MapLight;
    buildings: Buildings3DConfig;
    landmarks: Landmarks3DConfig;
    /** The textured ground and its trees, in the map's colours for their season: summer unless set. A flat print or neon look leaves them out. */
    surfaces?: GLSurfacesConfig;
    effects: MapEffectsConfig;
    /** A stylisation of the frame, run inside the effects' own chain so the bloom and grade read it. */
    pass?: MapEffectsPass;
};

/** Keeps a look's name as that name, so a fly-by can only pick one that exists. */
export const look = <T extends string>(label: T): T => label;
