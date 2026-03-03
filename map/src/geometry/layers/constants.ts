// ─── Geometry (utility) ──────────────────────────────────────────────────────

/** The world ring produced by turf.mask */
export const TURF_MASK_WORLD_RING = [
    [180, 90],
    [-180, 90],
    [-180, -90],
    [180, -90],
    [180, 90],
];

// ─── Default geometry styling ─────────────────────────────────────────────────

/** Default fill/line color for geometries. */
export const DEFAULT_COLOR = '#0A3653';

/** Default fill opacity. */
export const DEFAULT_FILL_OPACITY = 0.15;

/** Default line color. */
export const DEFAULT_LINE_OPACITY = 1;

/** Default line width in pixels. */
export const DEFAULT_LINE_WIDTH = 2;

// ─── Themed geometry styling (outline / filled / inverted) ───────────────────

/** Fill opacity for the outline theme (transparent fill). */
export const OUTLINE_THEME_FILL_OPACITY = 0;

/** Line color for the outline theme. */
export const OUTLINE_THEME_LINE_COLOR = '#555555';

/** Line opacity for the outline theme. */
export const OUTLINE_THEME_LINE_OPACITY = 0.9;

/** Line width for the outline theme. */
export const OUTLINE_THEME_LINE_WIDTH = 5;

/** Fill opacity for the filled/inverted theme. */
export const FILLED_THEME_FILL_OPACITY = 0.6;

/** Line color for the filled/inverted theme. */
export const FILLED_THEME_LINE_COLOR = 'grey';

/** Line opacity for the filled/inverted theme. */
export const FILLED_THEME_LINE_OPACITY = 1;

/** Line width for the filled/inverted theme. */
export const FILLED_THEME_LINE_WIDTH = 1;

// ─── Label styling ────────────────────────────────────────────────────────────

/** Text color shared by title and border labels. */
export const TITLE_COLOR = '#333333';

/** Text halo color shared by title and border labels. */
export const TITLE_HALO_COLOR = '#FFFFFF';

/** Text size for geometry title (point) labels. */
export const TITLE_SIZE = 15;

/** Text padding for geometry title (point) labels. */
export const TITLE_PADDING = 5;

/** Minimum zoom level for border labels. */
export const BORDER_LABEL_MIN_ZOOM = 3;

/** Text size for border labels. */
export const BORDER_LABEL_TEXT_SIZE = 15;

/** Symbol spacing for border labels, in pixels. */
export const BORDER_LABEL_SYMBOL_SPACING = 200;

/** Text halo width for border labels, in pixels. */
export const BORDER_LABEL_TEXT_HALO_WIDTH = 2;
