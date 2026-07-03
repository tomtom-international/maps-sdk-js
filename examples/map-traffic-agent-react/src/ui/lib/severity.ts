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

/** Fill colour for a magnitude-of-delay value, falling back to the neutral `unknown` grey. */
export const severityColor = (magnitude: string): string => SEVERITY_COLOR[magnitude] ?? SEVERITY_COLOR.unknown;

/** Human label for a magnitude-of-delay value, falling back to the raw value. */
export const severityLabel = (magnitude: string): string => SEVERITY_LABEL[magnitude] ?? magnitude;
