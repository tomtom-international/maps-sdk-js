import { ExpressionSpecification } from "maplibre-gl";

export const MAP_BOLD_FONT = "Noto-Bold";
export const DEFAULT_TEXT_SIZE: ExpressionSpecification = ["interpolate", ["linear"], ["zoom"], 10, 12, 16, 14];

export const mapFonts = ["Noto-Regular", "NotoSans-MediumItalic", "Noto-Bold", "Noto-Medium"] as const;
export type MapFont = (typeof mapFonts)[number];
