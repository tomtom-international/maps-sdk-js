import { ExpressionSpecification } from "maplibre-gl";

export const MAP_BOLD_FONT = "Noto-Bold";
export const DEFAULT_TEXT_SIZE: ExpressionSpecification = ["interpolate", ["linear"], ["zoom"], 10, 12, 16, 14];
export const DEFAULT_ICON_SIZE: ExpressionSpecification = ["interpolate", ["linear"], ["zoom"], 10, 0.7, 16, 0.85];
