export function initTogglePanel(): void {
    const toggleButton = document.querySelector('.sdk-example-heading-toggle');
    const panelContent = document.querySelector('.sdk-example-panel-content');

    toggleButton?.addEventListener('click', () => {
        const isExpanded = toggleButton.getAttribute('aria-expanded') === 'true';
        toggleButton.setAttribute('aria-expanded', isExpanded ? 'false' : 'true');
        panelContent?.classList.toggle('collapsed');
    });

    const bottomPanelToggle = document.querySelector('.aa-bottom-panel-toggle');
    const bottomPanelContent = document.querySelector('.aa-bottom-panel-content');

    bottomPanelToggle?.addEventListener('click', () => {
        const isExpanded = bottomPanelToggle.getAttribute('aria-expanded') === 'true';
        bottomPanelToggle.setAttribute('aria-expanded', isExpanded ? 'false' : 'true');
        bottomPanelContent?.classList.toggle('collapsed');
    });
}
