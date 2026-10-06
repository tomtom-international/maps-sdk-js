import { noStateColor, stateColors } from './layers';

export const paintLegend = () => {
    for (const [state, color] of Object.entries({ none: noStateColor, ...stateColors })) {
        const swatch = document.querySelector<HTMLElement>(`[data-state="${state}"]`);
        if (swatch) swatch.style.background = color;
    }
};
