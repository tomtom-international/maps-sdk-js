export type RouteColorState = {
    mainColor: string | undefined;
};

export const initControls = (state: RouteColorState, apply: () => void): void => {
    // Panel toggle
    const toggleButton = document.querySelector('.sdk-example-heading-toggle');
    const panelContent = document.querySelector('.sdk-example-panel-content');
    toggleButton?.addEventListener('click', () => {
        const isExpanded = toggleButton.getAttribute('aria-expanded') === 'true';
        toggleButton.setAttribute('aria-expanded', isExpanded ? 'false' : 'true');
        panelContent?.classList.toggle('collapsed');
    });

    // Route color picker
    const colorPicker = document.getElementById('routeColor-picker') as HTMLInputElement;
    colorPicker?.addEventListener('input', () => {
        state.mainColor = colorPicker.value;
        apply();
    });
};
