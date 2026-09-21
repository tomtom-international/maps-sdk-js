/**
 * Panel design tokens — `var(--ui-*)` strings referencing the shared token layer
 * (`base/tokens.css`), which carries TomTom Playbook's own token names and values. Usable in
 * inline styles, so the panels track the same design system as the chat and Figma.
 */
export const playbook = {
    surface: {
        surface0: 'var(--ui-surface-0)',
        surface1: 'var(--ui-surface-1)',
        surface2: 'var(--ui-surface-2)',
        highEm: 'var(--ui-text-high-em)', // score-bar fill — darkest neutral
        infoAccent: 'var(--ui-surface-info-accent-1)', // gentle info tint; subtle, non-brand
    },
    text: {
        highEm: 'var(--ui-text-high-em)',
        medEm: 'var(--ui-text-med-em)',
        lowEm: 'var(--ui-text-low-em)',
        brand: 'var(--ui-surface-brand-red)', // TomTom brand red — headline scores / accents
    },
    border: {
        lowEm: 'var(--ui-border-low-em)',
        medEm: 'var(--ui-border-med-em)',
    },
    outline: {
        focusPrimary: 'var(--ui-shadow-focus)', // mandatory keyboard-focus ring
    },
    elevation: {
        e1: 'var(--ui-elevation-e1)',
        e2: 'var(--ui-elevation-e2)',
        e3: 'var(--ui-elevation-e3)',
    },
    font: {
        headings: 'var(--ui-font-gilroy)', // Gilroy
        body: 'var(--ui-font-proxima)', // Proxima Nova
    },
    radius: {
        lg: 'var(--ui-rounded-20)',
    },
} as const;
