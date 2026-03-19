import type { RouteWaypointSize, RouteWidth } from '@tomtom-org/maps-sdk/map';

export type RoutePlaygroundState = {
    mainColor: string | undefined;
    routeWidth: RouteWidth;
    waypointSize: RouteWaypointSize;
    centerDash: boolean;
    routeOpacity: number;
};

export const initControls = (state: RoutePlaygroundState, apply: () => void): void => {
    // Panel toggle
    const toggleButton = document.querySelector('.sdk-example-heading-toggle')!;
    const panelContent = document.querySelector('.sdk-example-panel-content')!;
    toggleButton.addEventListener('click', () => {
        const isExpanded = toggleButton.getAttribute('aria-expanded') === 'true';
        toggleButton.setAttribute('aria-expanded', isExpanded ? 'false' : 'true');
        panelContent.classList.toggle('collapsed');
    });

    // Route color swatches
    document.querySelectorAll<HTMLButtonElement>('#routeColor-selectors .sdk-example-color-selector').forEach((btn) => {
        btn.addEventListener('click', () => {
            document
                .querySelectorAll('#routeColor-selectors .sdk-example-color-selector')
                .forEach((b) => b.classList.remove('active'));
            btn.classList.add('active');
            state.mainColor = btn.dataset.color || undefined;
            apply();
        });
    });

    // Route width radios
    document.querySelectorAll<HTMLInputElement>('input[name="routeWidth"]').forEach((radio) => {
        radio.addEventListener('change', () => {
            state.routeWidth = radio.value as RouteWidth;
            apply();
        });
    });

    // Waypoint size radios
    document.querySelectorAll<HTMLInputElement>('input[name="waypointSize"]').forEach((radio) => {
        radio.addEventListener('change', () => {
            state.waypointSize = radio.value as RouteWaypointSize;
            apply();
        });
    });

    // Center dash toggle
    document.getElementById('toggle-center-dash')?.addEventListener('change', (e) => {
        state.centerDash = (e.target as HTMLInputElement).checked;
        apply();
    });

    // Route opacity slider
    const opacitySlider = document.getElementById('route-opacity') as HTMLInputElement;
    const opacityValue = document.getElementById('route-opacity-value') as HTMLElement;
    opacitySlider?.addEventListener('input', () => {
        const pct = Number(opacitySlider.value);
        opacityValue.textContent = `${pct}%`;
        state.routeOpacity = pct / 100;
        apply();
    });
};
