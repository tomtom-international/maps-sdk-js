import type { MapColors } from '@tomtom-org/maps-sdk/map';

// The colours the theme resolved to, so you can see what became what: the ten base-map roles, and
// `accent`, which the area, the pins and the route are drawn in.
export const showSwatches = (container: HTMLElement, colors: Required<MapColors>): void =>
    container.replaceChildren(
        ...Object.entries(colors).map(([role, color]) => {
            const swatch = document.createElement('span');
            swatch.className = 'ui-swatch';
            swatch.title = `${role}: ${color}`;
            swatch.style.background = color;
            swatch.textContent = role;
            return swatch;
        }),
    );
