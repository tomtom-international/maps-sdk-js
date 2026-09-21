export const initTogglePanel = () => {
    const toggleButton = document.querySelector('.ui-heading-toggle');
    const panelContent = document.querySelector('.ui-panel-content');

    if (!toggleButton || !panelContent) {
        return;
    }

    toggleButton.addEventListener('click', () => {
        const isExpanded = toggleButton.getAttribute('aria-expanded') === 'true';
        toggleButton.setAttribute('aria-expanded', isExpanded ? 'false' : 'true');
        panelContent.classList.toggle('collapsed');
    });
};
