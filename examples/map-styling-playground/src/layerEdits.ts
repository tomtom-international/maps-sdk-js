import type { LayerSelection, StylingFoundationsModule } from '@tomtom-org/maps-sdk/map';

// The advanced tier: a raw paint edit on the layers a query selects. It survives a style switch as
// the knobs do, but it is not a setting, so "Reset to style defaults" leaves it in place.
const bindLayerEdit = (toggleId: string, selection: LayerSelection, edit: (selection: LayerSelection) => void) => {
    const toggle = document.querySelector(`#${toggleId}`) as HTMLInputElement;
    toggle.addEventListener('change', () => {
        if (toggle.checked) edit(selection);
        else selection.reset();
    });
};

export const initLayerEdits = (styling: StylingFoundationsModule) => {
    bindLayerEdit('ui-roadLabelsEdit', styling.layers.query({ group: 'roadLabels' }), (roadLabels) =>
        roadLabels.setPaint({ 'text-color': '#c026d3' }),
    );
    // A group can name another style-owned module's layers too: here the traffic flow lines.
    bindLayerEdit(
        'ui-trafficFlowEdit',
        styling.layers.query({ group: 'trafficFlow', layerTypes: ['line'] }),
        (flowLines) => flowLines.setPaint({ 'line-opacity': 0.35 }),
    );
};
