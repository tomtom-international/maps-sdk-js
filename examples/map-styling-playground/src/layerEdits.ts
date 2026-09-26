import type { StylingModule } from '@tomtom-org/maps-sdk/map';

// The advanced tier: a raw paint edit on the layers a query selects. It survives a style switch as
// the knobs do, but it is not a setting, so "Reset to style defaults" leaves it in place.
export const initLayerEdits = (styling: StylingModule) => {
    const roadLabels = styling.layers.query({ group: 'roadLabels' });
    const toggle = document.querySelector('#ui-roadLabelsEdit') as HTMLInputElement;
    toggle.addEventListener('change', () => {
        if (toggle.checked) roadLabels.setPaint({ 'text-color': '#c026d3' });
        else roadLabels.reset();
    });
};
