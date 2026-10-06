import {
    knobEntryOf,
    type PlaceLayersConfig,
    type PlacesKnobId,
    type PlacesModuleConfig,
    placesKnobCatalogue,
} from '@tomtom-org/maps-sdk/map';
import { element } from './dom';

type ClusterPanelConfig = Pick<PlacesModuleConfig, 'cluster' | 'layers'>;

// The feature property each charging station carries, summed into a cluster property of the same name.
export const CONNECTORS_PROPERTY = 'connectors';

// A control starts at the value the SDK applies when the config leaves its knob unset.
const startAtDefault = (input: HTMLInputElement, knobId: PlacesKnobId) => {
    const knobDefault = knobEntryOf(placesKnobCatalogue, knobId).default;
    if (knobDefault !== undefined) input.value = String(knobDefault);
};

const slider = (name: string, knobId: PlacesKnobId) => {
    const input = element<HTMLInputElement>(`#ui-${name}`);
    const value = element<HTMLElement>(`#ui-${name}Value`);
    startAtDefault(input, knobId);
    value.textContent = input.value;
    return { input, value };
};
const clusterRadius = slider('clusterRadius', 'cluster.source.radius');
const clusterMaxZoom = slider('clusterMaxZoom', 'cluster.source.maxZoom');
const clusterMinPoints = slider('clusterMinPoints', 'cluster.source.minPoints');
const singleRadius = slider('singleRadius', 'cluster.badge.radius.single');
const mixedRadius = slider('mixedRadius', 'cluster.badge.radius.mixed');
const badgeColor = element<HTMLInputElement>('#ui-badgeColor');
startAtDefault(badgeColor, 'cluster.badge.color');
const zoomNote = element<HTMLElement>('#ui-zoomNote');

const countsConnectors = (): boolean =>
    element<HTMLInputElement>('input[name="ui-badgeCount"]:checked').value === CONNECTORS_PROPERTY;

const connectorsCountText: PlaceLayersConfig['clusterCount'] = {
    layout: { 'text-field': ['get', CONNECTORS_PROPERTY] },
};

export const readClusterConfig = (): ClusterPanelConfig => ({
    cluster: {
        source: {
            radius: Number(clusterRadius.input.value),
            maxZoom: Number(clusterMaxZoom.input.value),
            minPoints: Number(clusterMinPoints.input.value),
            properties: { [CONNECTORS_PROPERTY]: ['+', ['get', CONNECTORS_PROPERTY]] },
        },
        badge: {
            color: badgeColor.value,
            radius: { single: Number(singleRadius.input.value), mixed: Number(mixedRadius.input.value) },
        },
    },
    // Left unset, both badges print the place count MapLibre puts on every cluster.
    layers: countsConnectors()
        ? { clusterCount: connectorsCountText, clusterMixedCount: connectorsCountText }
        : undefined,
});

export const initPanel = (onChange: (config: ClusterPanelConfig) => void): void => {
    const apply = () => onChange(readClusterConfig());
    for (const { input, value } of [clusterRadius, clusterMaxZoom, clusterMinPoints, singleRadius, mixedRadius]) {
        input.addEventListener('input', () => {
            value.textContent = input.value;
        });
        // On release: a change to the clustering options recreates the places source.
        input.addEventListener('change', apply);
    }
    badgeColor.addEventListener('change', apply);
    for (const radio of document.querySelectorAll<HTMLInputElement>('input[name="ui-badgeCount"]')) {
        radio.addEventListener('change', apply);
    }
};

export const showZoom = (zoom: number): void => {
    zoomNote.textContent = `Map zoom ${zoom.toFixed(1)}. Clusters break apart at zoom ${Number(clusterMaxZoom.input.value) + 1}.`;
};
