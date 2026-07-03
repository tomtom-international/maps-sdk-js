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
        surface0: 'var(--pb-surface-0)',
        surface1: 'var(--pb-surface-1)',
        surface2: 'var(--pb-surface-2)',
        infoAccent: '#F5F8FA', // gentle info tint (no design-system token for it); subtle, non-brand
    },
    text: {
        highEm: 'var(--pb-text-high)',
        medEm: 'var(--pb-text-medium)',
        lowEm: 'var(--pb-text-low)',
        white: 'var(--pb-text-white)',
        brand: 'var(--pb-primary-color)', // TomTom brand red — accents / headline scores
    },
    // Semantic status colours (Figma status tags, emphasis KPI tiles).
    status: {
        error: 'var(--pb-color-error)',
        warning: 'var(--pb-color-warning)',
        success: 'var(--pb-color-success)',
        info: 'var(--pb-color-info)',
    },
    border: {
        lowEm: 'var(--pb-border-low)',
        medEm: 'var(--pb-border-medium)',
        highEm: 'var(--pb-border-high)',
    },
    elevation: {
        e1: 'var(--pb-shadow-e1)',
        e2: 'var(--pb-shadow-e2)',
        e3: 'var(--pb-shadow-e3)',
        e4: 'var(--pb-shadow-e4)',
    },
    outline: {
        focusPrimary: 'var(--pb-shadow-focus)', // mandatory keyboard-focus ring
    },
    radius: {
        sm: 'var(--pb-radius-5)',
        md: 'var(--pb-radius-10)',
        lg: 'var(--pb-radius-20)',
    },
    font: {
        headings: 'var(--pb-font-primary)', // Gilroy
        body: 'var(--pb-font-secondary)', // Proxima Nova
        code: 'var(--pb-font-code)',
    },
    weight: { semibold: 600, bold: 700 },
} as const;

/**
 * A translucent tint of a token colour — the fill behind Figma status pills ("Major delay") and the
 * emphasis KPI tiles (red Incidents/Delay, blue Major+/Closures). Defaults to 12% over transparent.
 */
export const tint = (color: string, percent = 12): string => `color-mix(in srgb, ${color} ${percent}%, transparent)`;
