import { LightDark } from "../../shared/types/style";
/**
 * Calculates theme-adaptive text colors based on light/dark mode.
 * @param isDarkMode Whether the current theme is dark
 * @returns Object with text and halo colors appropriate for the theme
 * @ignore
 *
 * TODO: Should these colors adapt to the POI context colors,
 * or should they remain as fixed defaults?
 */
export const getThemeAdaptiveTextColors = (
    lightDark: LightDark,
): {
    textColor: string;
    haloColor: string;
} => {
    return {
        textColor: lightDark === 'dark' ? '#FFFFFF' : '#333333',
        haloColor: lightDark === 'dark' ? '#333333' : '#FFFFFF',
    };
};
