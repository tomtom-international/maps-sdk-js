import type { LightDark } from '../../shared';
import { relativeLuminance } from '../../utils/colorUtils';
import type { CountryCrossingConfig } from '../types/routeModuleConfig';

/** The SDK's near-black, the plaque on a light map and the label on a light plaque. */
const NEAR_BLACK = '#1A2024';

/** The SDK's near-white, the plaque on a dark map and the label on a dark plaque. */
const NEAR_WHITE = '#F1F3F5';

// Above this relative luminance (0 = black, 1 = white) a plaque needs the dark label.
const LIGHT_PLAQUE_THRESHOLD = 0.4;

/** The two colours a crossing plaque is drawn with. */
export type CountryCrossingColors = {
    /** Fill of the plaque image. */
    plaque: string;
    /** Colour of the label written on it. */
    text: string;
};

/**
 * The colours a crossing draws with, given its config and the map's theme.
 *
 * @remarks
 * The plaque opposes the map so it reads as a label rather than as part of the canvas, and the
 * label opposes the plaque. A caller who sets only `color` still gets a readable label, because the
 * fallback is measured off that colour rather than off the theme.
 * @ignore
 */
export const resolveCountryCrossingColors = (
    config: CountryCrossingConfig | undefined,
    lightDark: LightDark,
): CountryCrossingColors => {
    const plaque = config?.color ?? (lightDark === 'dark' ? NEAR_WHITE : NEAR_BLACK);
    const luminance = relativeLuminance(plaque);
    const readable = luminance !== undefined && luminance > LIGHT_PLAQUE_THRESHOLD ? NEAR_BLACK : NEAR_WHITE;

    return { plaque, text: config?.textColor ?? readable };
};
