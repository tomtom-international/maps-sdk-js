/**
 * Figma design tokens for the traffic agent — the "playbook" token set. A thin, typed alias over the
 * shared TomTom design system: the SAME tokens the Figma file defines (brand red, Gilroy / Proxima Nova,
 * the grey ramp, radii, elevations). Components reference `playbook.*` instead of raw CSS variables, so
 * the map panels, the chat surface, and the Figma design stay in lockstep from ONE source. Values are
 * CSS-var strings — valid in inline `style={}` and in Tailwind arbitrary values — and they update
 * automatically if the design system changes. This file is the single place the underlying variables
 * are named; nothing else should reference them directly.
 */
export const playbook = {
    surface: {
        surface0: 'var(--ui-surface-0)',
        surface1: 'var(--ui-surface-1)',
        surface2: 'var(--ui-surface-2)',
        infoAccent: 'var(--ui-surface-info-accent-1)', // gentle info tint; subtle, non-brand
    },
    text: {
        highEm: 'var(--ui-text-high-em)',
        medEm: 'var(--ui-text-med-em)',
        lowEm: 'var(--ui-text-low-em)',
        white: 'var(--ui-text-white)',
        brand: 'var(--ui-surface-brand-red)', // TomTom brand red — accents / headline scores
    },
    // Semantic status colours (Figma status tags, emphasis KPI tiles).
    status: {
        error: 'var(--ui-surface-brand-red)',
        warning: 'var(--ui-surface-warning)',
        success: 'var(--ui-surface-success)',
        info: 'var(--ui-surface-info)',
    },
    border: {
        base: 'var(--ui-border-base-em)',
        lowEm: 'var(--ui-border-low-em)',
        medEm: 'var(--ui-border-med-em)',
        highEm: 'var(--ui-border-high-em)',
    },
    elevation: {
        e1: 'var(--ui-elevation-e1)',
        e2: 'var(--ui-elevation-e2)',
        e3: 'var(--ui-elevation-e3)',
        e4: 'var(--ui-elevation-e4)',
    },
    outline: {
        focusPrimary: 'var(--ui-shadow-focus)', // mandatory keyboard-focus ring
    },
    radius: {
        sm: 'var(--ui-rounded-5)',
        md: 'var(--ui-rounded-10)',
        lg: 'var(--ui-rounded-20)',
    },
    font: {
        headings: 'var(--ui-font-gilroy)', // Gilroy
        body: 'var(--ui-font-proxima)', // Proxima Nova
        code: 'var(--ui-font-fira)',
    },
    weight: { semibold: 600, bold: 700 },
} as const;

/**
 * A translucent tint of a token colour — the fill behind Figma status pills ("Major delay") and the
 * emphasis KPI tiles (red Incidents/Delay, blue Major+/Closures). Defaults to 12% over transparent.
 */
export const tint = (color: string, percent = 12): string => `color-mix(in srgb, ${color} ${percent}%, transparent)`;
