// Minimal inline glyphs for the tracker rail (24px type-icon box). Currentcolor so FeedRow's
// `iconColor` drives them. Kept local + small — the generic tracker has no incident-type vocabulary,
// so a fired alert uses a warning glyph and a cleared one a check.
const SVG = (props: { children: React.ReactNode }) => (
    <svg
        viewBox="0 0 24 24"
        width="18"
        height="18"
        fill="none"
        stroke="currentColor"
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
        aria-hidden="true"
    >
        {props.children}
    </svg>
);

/** Fired/opened alert — warning triangle. */
export const AlertGlyph = () => (
    <SVG>
        <path d="M10.29 3.86 1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0Z" />
        <line x1="12" y1="9" x2="12" y2="13" />
        <line x1="12" y1="17" x2="12.01" y2="17" />
    </SVG>
);

/** Resolved/cleared — check. */
export const ResolvedGlyph = () => (
    <SVG>
        <path d="M20 6 9 17l-5-5" />
    </SVG>
);

/** Locate / focus the tracker's members on the map. */
export const LocateGlyph = () => (
    <SVG>
        <circle cx="12" cy="12" r="3" />
        <path d="M12 2v3M12 19v3M2 12h3M19 12h3" />
    </SVG>
);

/** Clear / remove. */
export const TrashGlyph = () => (
    <SVG>
        <path d="M3 6h18M8 6V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2m2 0v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6" />
    </SVG>
);

/** Route / corridor — two waypoints joined by a path. Marks a route-monitor card apart from a watched
 *  area. Sized 14px for the card's small eyebrow label, so it skips the 18px SVG wrapper. */
export const RouteGlyph = () => (
    <svg
        viewBox="0 0 24 24"
        width="14"
        height="14"
        fill="none"
        stroke="currentColor"
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
        aria-hidden="true"
    >
        <circle cx="6" cy="19" r="3" />
        <path d="M9 19h8.5a3.5 3.5 0 0 0 0-7h-11a3.5 3.5 0 0 1 0-7H15" />
        <circle cx="18" cy="5" r="3" />
    </svg>
);

/** Stop — a minus in a circle (Figma "Stop monitoring" button glyph). 16px to sit inline with button text. */
export const StopGlyph = () => (
    <svg
        viewBox="0 0 24 24"
        width="16"
        height="16"
        fill="none"
        stroke="currentColor"
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
        aria-hidden="true"
    >
        <circle cx="12" cy="12" r="10" />
        <path d="M8 12h8" />
    </svg>
);
