export type RouteColorState = {
    color: string | undefined;
};

export const initControls = (state: RouteColorState, apply: () => void): void => {
    // Route color picker
    const colorPicker = document.getElementById('routeColor-picker') as HTMLInputElement;
    colorPicker?.addEventListener('input', () => {
        state.color = colorPicker.value;
        apply();
    });
};
