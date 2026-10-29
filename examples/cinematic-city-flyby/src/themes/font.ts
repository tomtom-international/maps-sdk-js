import type { CustomTypeface } from '@tomtom-org/maps-sdk/map';

// One family from Fontsource: its regular weight and bold, and its italic where it has one.
export const fontsource = (
    family: string,
    { regular = 400, bold = 700, italic = true }: { regular?: number; bold?: number | false; italic?: boolean } = {},
) => {
    const file = (weight: number, style: 'normal' | 'italic') =>
        `https://cdn.jsdelivr.net/fontsource/fonts/${family}@latest/latin-${weight}-${style}.woff2`;
    const typeface: CustomTypeface = { regular: file(regular, 'normal') };
    if (bold) typeface.bold = file(bold, 'normal');
    if (italic) typeface.regularItalic = file(regular, 'italic');
    return typeface;
};
