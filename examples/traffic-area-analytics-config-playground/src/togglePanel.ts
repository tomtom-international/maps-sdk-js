export const initTogglePanel = (): void => {
    const btn = document.querySelector('.sdk-example-heading-toggle');
    btn?.addEventListener('click', () => {
        const expanded = btn.getAttribute('aria-expanded') === 'true';
        btn.setAttribute('aria-expanded', String(!expanded));
        document.querySelector('.sdk-example-panel-content')?.classList.toggle('collapsed');
    });
};
