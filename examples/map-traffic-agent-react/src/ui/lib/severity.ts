// Canonical traffic-severity colour ramp + labels for the TomTom magnitude-of-delay scale. Single
// source of truth: the KPI strip, incident-details card, and triage list all read these so the ramp
// stays in lockstep (previously each panel kept its own copy and they had drifted — `indefinite`
// rendered a different red in the KPI strip than in the details card).
export const SEVERITY_COLOR: Record<string, string> = {
    unknown: 'hsl(198, 20%, 54%)',
    minor: 'hsl(45, 100%, 51%)',
    moderate: 'hsl(9, 97%, 51%)',
    major: 'hsl(0, 100%, 34%)',
    indefinite: 'hsl(0, 90%, 26%)', // darker than `major` so a closure reads distinct from a major delay
};

export const SEVERITY_LABEL: Record<string, string> = {
    unknown: 'No delay',
    minor: 'Minor',
    moderate: 'Moderate',
    major: 'Major',
    indefinite: 'Road closed',
};

// A KPI tile normally colours itself from the SEVERITY_COLOR value above — that colour as the text, over
// a light tint of itself. That fails for `minor`, whose colour is a bright yellow that's unreadable as
// text on a near-white tint. So `minor` gets an explicit palette instead (the Figma warning tokens: dark
// text, soft-yellow surface, saturated border). Darker severities read fine as text, so they're omitted.
type TilePalette = { color: string; background: string; border: string };

const SEVERITY_TILE: Partial<Record<string, TilePalette>> = {
    minor: { color: '#634801', background: '#FFF5DD', border: '#FDCF53' },
};

/** Explicit tile palette for a severity, or `undefined` to derive it from the ramp colour. */
export const severityTile = (magnitude: string): TilePalette | undefined => SEVERITY_TILE[magnitude];

/** Fill colour for a magnitude-of-delay value, falling back to the neutral `unknown` grey. */
export const severityColor = (magnitude: string): string => SEVERITY_COLOR[magnitude] ?? SEVERITY_COLOR.unknown;

/** Human label for a magnitude-of-delay value, falling back to the raw value. */
export const severityLabel = (magnitude: string): string => SEVERITY_LABEL[magnitude] ?? magnitude;
