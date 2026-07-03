/**
 * Panel design tokens — `var(--pb-*)` strings aliasing the shared playbook layer
 * (`base/playbook-tokens.css`, which itself aliases the SDK `--sdk-*` system). Usable in inline styles,
 * so the panels track the same TomTom design system as the chat and Figma.
 */
export const playbook = {
    surface: {
        surface0: 'var(--pb-surface-0)',
        surface1: 'var(--pb-surface-1)',
        surface2: 'var(--pb-surface-2)',
        highEm: 'var(--pb-text-high)', // score-bar fill — darkest neutral
        infoAccent: '#F5F8FA', // gentle info tint (no SDK token for it); subtle, non-brand
    },
    text: {
        highEm: 'var(--pb-text-high)',
        medEm: 'var(--pb-text-medium)',
        lowEm: 'var(--pb-text-low)',
        brand: 'var(--pb-primary-color)', // TomTom brand red — headline scores / accents
    },
    border: {
        lowEm: 'var(--pb-border-low)',
        medEm: 'var(--pb-border-medium)',
    },
    outline: {
        focusPrimary: 'var(--pb-shadow-focus)', // mandatory keyboard-focus ring
    },
    elevation: {
        e1: 'var(--pb-shadow-e1)',
        e2: 'var(--pb-shadow-e2)',
        e3: 'var(--pb-shadow-e3)',
    },
    font: {
        headings: 'var(--pb-font-primary)', // Gilroy
        body: 'var(--pb-font-secondary)', // Proxima Nova
    },
    radius: {
        lg: 'var(--pb-radius-20)',
    },
} as const;
