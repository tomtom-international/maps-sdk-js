export const initTogglePanel = (): void => {
    const btn = document.querySelector('.ui-heading-toggle');
    btn?.addEventListener('click', () => {
        const expanded = btn.getAttribute('aria-expanded') === 'true';
        btn.setAttribute('aria-expanded', String(!expanded));
        document.querySelector('.ui-panel-content')?.classList.toggle('collapsed');
    });
};
