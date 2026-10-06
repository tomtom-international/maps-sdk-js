import type {
    GeometriesModule,
    GeometryLayersConfig,
    LayerSelection,
    StylingFoundationsModule,
    TrafficIncidentDetailsLayersConfig,
    TrafficIncidentDetailsModule,
} from '@tomtom-org/maps-sdk/map';
import type { ExpressionSpecification } from 'maplibre-gl';

const widthByZoom = (atZoom9: number, atZoom13: number, atZoom19: number): ExpressionSpecification => [
    'interpolate',
    ['exponential', 1.5],
    ['zoom'],
    5,
    0,
    9,
    atZoom9,
    13,
    atZoom13,
    19,
    atZoom19,
];

// Layers a module adds take their overrides through that module's own `layers` config.
const incidentLayers: TrafficIncidentDetailsLayersConfig = {
    outline: { paint: { 'line-width': widthByZoom(8, 14, 34), 'line-blur': 5 } },
    innerSolid: { paint: { 'line-width': widthByZoom(3, 6, 24) } },
    innerPattern: { paint: { 'line-width': widthByZoom(3, 6, 24) } },
    innerChevron: { layout: { visibility: 'none' } },
};

const boundaryLayers: GeometryLayersConfig = {
    line: { paint: { 'line-color': '#0f172a', 'line-width': 4, 'line-dasharray': [3, 1.5] } },
};

export const initFocus = (
    styling: StylingFoundationsModule,
    incidents: TrafficIncidentDetailsModule,
    boundary: GeometriesModule,
) => {
    // The style's own layers, by group: these queries never reach the incidents or the boundary.
    const backdrop: [LayerSelection, Parameters<LayerSelection['setPaint']>[0]][] = [
        [styling.layers.query({ group: 'trafficFlow', layerTypes: ['line'] }), { 'line-opacity': 0.12 }],
        [styling.layers.query({ group: 'roads', layerTypes: ['line'] }), { 'line-opacity': 0.3 }],
        [styling.layers.query({ group: 'pois' }), { 'icon-opacity': 0.2, 'text-opacity': 0.2 }],
        [styling.layers.query({ group: 'roadLabels' }), { 'text-opacity': 0.3 }],
    ];

    const setFocus = (focused: boolean) => {
        incidents.updateConfig({ layers: focused ? incidentLayers : undefined });
        boundary.updateConfig({ layers: focused ? boundaryLayers : undefined });
        for (const [selection, paint] of backdrop) {
            if (focused) selection.setPaint(paint);
            else selection.reset();
        }
    };

    const toggle = document.querySelector('#ui-focus') as HTMLInputElement;
    toggle.addEventListener('change', () => setFocus(toggle.checked));
    setFocus(toggle.checked);
};
