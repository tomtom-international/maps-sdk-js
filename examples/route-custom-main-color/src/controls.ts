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

    // Route color swatches
    document.querySelectorAll<HTMLButtonElement>('#color-selectors .sdk-example-color-selector').forEach((btn) => {
        btn.addEventListener('click', () => {
            document
                .querySelectorAll('#color-selectors .sdk-example-color-selector')
                .forEach((b) => b.classList.remove('active'));
            btn.classList.add('active');
            state.mainColor = btn.dataset.color || undefined;
            apply();
        });
    });
};
