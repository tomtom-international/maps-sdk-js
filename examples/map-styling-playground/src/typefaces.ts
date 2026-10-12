import { type CustomTypeface, type MapTypeface, mapTypefaces } from '@tomtom-org/maps-sdk/map';

// Open-source families (SIL Open Font License) from the Fontsource CDN. The map downloads the files
// itself; the SDK bundles no font.
const fontsource = (family: string, italic: boolean): CustomTypeface => {
    const file = (weight: number, style: 'normal' | 'italic') =>
        `https://cdn.jsdelivr.net/fontsource/fonts/${family}@5.3.0/latin-${weight}-${style}.woff2`;
    return {
        regular: file(400, 'normal'),
        medium: file(500, 'normal'),
        bold: file(700, 'normal'),
        ...(italic && {
            regularItalic: file(400, 'italic'),
            mediumItalic: file(500, 'italic'),
            boldItalic: file(700, 'italic'),
        }),
    };
};

export const fontFamilies: Record<string, CustomTypeface> = {
    Fraunces: fontsource('fraunces', true),
    'Playfair Display': fontsource('playfair-display', true),
    Merriweather: fontsource('merriweather', true),
    Bitter: fontsource('bitter', true),
    'Space Grotesk': fontsource('space-grotesk', false),
    'Josefin Sans': fontsource('josefin-sans', true),
    Quicksand: fontsource('quicksand', false),
    Oswald: fontsource('oswald', false),
    Caveat: fontsource('caveat', false),
    'IBM Plex Mono': fontsource('ibm-plex-mono', true),
};

/** A typeface as both a module's `label` and the map's `labels` take it: font files, or one of the style's Noto faces. */
export type TypefaceChoice = { customTypeface: CustomTypeface } | { typeface: MapTypeface };

export const typefaceChoices = new Map<string, TypefaceChoice>([
    ...Object.entries(fontFamilies).map(([name, customTypeface]): [string, TypefaceChoice] => [
        name,
        { customTypeface },
    ]),
    ...mapTypefaces.map((typeface): [string, TypefaceChoice] => [`Noto ${typeface.replace('-', ' ')}`, { typeface }]),
]);

/**
 * Fills the dropdown `id` with every choice, grouped by where the faces come from, behind a first
 * option for no choice when given one.
 */
export const typefaceSelect = (id: string, initial: string, noChoice?: string): HTMLSelectElement => {
    const select = document.getElementById(id) as HTMLSelectElement;
    if (noChoice) select.add(new Option(noChoice, ''));
    for (const [label, isFiles] of [
        ['Open-source font files', true],
        ["The map style's Noto faces", false],
    ] as const) {
        const group = document.createElement('optgroup');
        group.label = label;
        for (const [name, choice] of typefaceChoices) {
            if ('customTypeface' in choice === isFiles) group.append(new Option(name, name, false, name === initial));
        }
        select.append(group);
    }
    return select;
};
