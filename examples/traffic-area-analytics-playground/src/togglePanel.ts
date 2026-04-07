const wireToggle = (btnSel: string, contentSel: string): void => {
    const btn = document.querySelector(btnSel);
    btn?.addEventListener('click', () => {
        const expanded = btn.getAttribute('aria-expanded') === 'true';
        btn.setAttribute('aria-expanded', String(!expanded));
        document.querySelector(contentSel)?.classList.toggle('collapsed');
    });
};

export const initTogglePanel = (): void => {
    wireToggle('.sdk-example-heading-toggle', '.sdk-example-panel-content');
    wireToggle('.aa-bottom-panel-toggle', '.aa-bottom-panel-content');
};
