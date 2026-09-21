import { element } from './dom';

export const initTogglePanel = (): void => {
    const toggleButton = element<HTMLButtonElement>('.ui-heading-toggle');
    const panelContent = element<HTMLElement>('.ui-panel-content');

    toggleButton.addEventListener('click', () => {
        const isExpanded = toggleButton.getAttribute('aria-expanded') === 'true';
        toggleButton.setAttribute('aria-expanded', isExpanded ? 'false' : 'true');
        panelContent.classList.toggle('collapsed');
    });
};
