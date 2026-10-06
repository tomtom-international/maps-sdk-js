import type { MapColors } from '@tomtom-org/maps-sdk/map';
import {
    deriveMapColors,
    deriveMapColorsFromCss,
    deriveMapColorsFromImage,
    type MapThemeMode,
} from '@tomtom-org/maps-sdk-plugin-map-theme';
import { palettes } from './palettes';

export type Derive = (mode: MapThemeMode) => Required<MapColors> | Promise<Required<MapColors>>;

// One source themes the map at a time: a palette, typed colours, or an image or stylesheet file.
const sources = ['palette', 'colors', 'file'] as const;
type Source = (typeof sources)[number];

// Commas inside `rgb(…)` and `hsl(…)` do not separate colours.
const COLOR_SEPARATOR = /,(?![^(]*\))/;

// Calls `onTheme` with how to derive the theme whenever the chosen source or its input changes.
export const initSources = (onTheme: (derive: Derive) => void): void => {
    const paletteSelector = document.querySelector('#ui-palette') as HTMLSelectElement;
    const colorsInput = document.querySelector('#ui-colors') as HTMLInputElement;
    const fileInput = document.querySelector('#ui-file') as HTMLInputElement;
    const fileButton = document.querySelector('label[for="ui-file"]') as HTMLLabelElement;

    // The last file picked, so switching back to the file source re-themes from it.
    let fromFile: Derive | undefined;

    const deriveFrom: Record<Source, () => Derive | undefined> = {
        palette: () => (mode) => deriveMapColors(palettes[paletteSelector.value], { mode }),
        colors: () => {
            const colors = colorsInput.value.split(COLOR_SEPARATOR).map((color) => color.trim());
            return (mode) => deriveMapColors(colors.filter(Boolean), { mode });
        },
        file: () => fromFile,
    };
    const themeFrom = (source: Source) => {
        const derive = deriveFrom[source]();
        if (derive) onTheme(derive);
    };

    for (const radio of document.querySelectorAll<HTMLInputElement>('input[name="ui-source"]')) {
        radio.addEventListener('change', () => {
            const source = sources.find((candidate) => candidate === radio.value);
            if (!source) return;

            for (const section of document.querySelectorAll<HTMLElement>('.ui-source')) {
                section.hidden = section.dataset.source !== source;
            }
            themeFrom(source);
        });
    }

    // The colours source starts from the last palette, ready to edit.
    paletteSelector.addEventListener('change', () => {
        colorsInput.value = palettes[paletteSelector.value].join(', ');
        themeFrom('palette');
    });
    document.querySelector('#ui-apply')?.addEventListener('click', () => themeFrom('colors'));
    colorsInput.addEventListener('keydown', (event) => event.key === 'Enter' && themeFrom('colors'));

    // A photo, a logo, a poster: its dominant colours. A website's stylesheet or a design system's
    // tokens: the colours it paints with.
    fileInput.addEventListener('change', async () => {
        const file = fileInput.files?.[0];
        if (!file) return;

        const css = file.type.startsWith('image/') ? undefined : await file.text();
        fromFile = (mode) =>
            css === undefined ? deriveMapColorsFromImage(file, { mode }) : deriveMapColorsFromCss(css, { mode });
        fileButton.textContent = file.name;
        themeFrom('file');
    });

    colorsInput.value = palettes[paletteSelector.value].join(', ');
    themeFrom('palette');
};
