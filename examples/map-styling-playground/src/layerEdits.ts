import type { LayerSelection, StylingFoundationsModule } from '@tomtom-org/maps-sdk/map';

type LayerEdit = { toggle: HTMLInputElement; edit: () => void };

// The edits whose toggle is on land again after any undo, since a reset drops every edit on its layers.
const layerEdits: LayerEdit[] = [];

// The advanced tier: raw edits on the layers a query selects. They survive a style switch as the
// knobs do, but they are not settings, so "Reset to style defaults" leaves them in place.
const bindLayerEdit = (
    toggleId: string,
    selection: LayerSelection,
    edit: (selection: LayerSelection) => void,
    undo: (selection: LayerSelection) => void = (edited) => edited.reset(),
) => {
    const toggle = document.querySelector(`#${toggleId}`) as HTMLInputElement;
    layerEdits.push({ toggle, edit: () => edit(selection) });
    toggle.addEventListener('change', () => {
        if (toggle.checked) {
            edit(selection);
            return;
        }
        undo(selection);
        for (const other of layerEdits) if (other.toggle.checked) other.edit();
    });
};

const majorRoads: Parameters<LayerSelection['addFilterClause']>[0] = [
    'in',
    ['get', 'category'],
    ['literal', ['motorway', 'trunk', 'primary']],
];

export const initLayerEdits = (styling: StylingFoundationsModule) => {
    bindLayerEdit('ui-roadLabelsEdit', styling.layers.query({ group: 'roadLabels' }), (roadLabels) =>
        roadLabels.setPaint({ 'text-color': '#c026d3' }),
    );
    // A group can name another style-owned module's layers too: here the traffic flow lines.
    bindLayerEdit(
        'ui-trafficFlowEdit',
        styling.layers.query({ group: 'trafficFlow', layerTypes: ['line'] }),
        (flowLines) => flowLines.setPaint({ 'line-blur': 4 }),
    );
    // A value derived from the one beneath: the style's road name halo, or the `labelHalo` map colour's
    // once one is set, worked out again after every change of either.
    bindLayerEdit('ui-motorwayLabelsEdit', styling.layers.query({ ids: ['TransitLabels - Road'] }), (roadNames) =>
        roadNames.setPaint({
            'text-halo-color': (halo) =>
                typeof halo === 'string' || Array.isArray(halo)
                    ? ['case', ['==', ['get', 'category'], 'motorway'], '#ea580c', halo]
                    : halo,
        }),
    );
    // A clause narrowing the style's own filter on the road labels, instead of replacing it.
    bindLayerEdit(
        'ui-majorRoadLabelsEdit',
        styling.layers.query({ group: 'roadLabels' }),
        (roadLabels) => roadLabels.addFilterClause(majorRoads),
        (roadLabels) => roadLabels.removeFilterClause(majorRoads),
    );
};
