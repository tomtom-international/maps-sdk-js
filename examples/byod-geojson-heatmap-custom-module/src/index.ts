import { TomTomConfig } from '@tomtom-org/maps-sdk/core';
import { CustomGeoJSONModule, type StandardStyleID, standardStyleIDs, TomTomMap } from '@tomtom-org/maps-sdk/map';
import type { FeatureCollection, Point } from 'geojson';
import './style.css';
import { API_KEY } from './config';
import { buildMarkersLayers, heatmapLayers } from './layers';
import { initTogglePanel } from './togglePanel';

TomTomConfig.instance.put({ apiKey: API_KEY });

const map = new TomTomMap({
    mapLibre: {
        container: 'sdk-map',
        center: [-1.7, 53.75],
        zoom: 9.5,
    },
});

const DATA_URL = 'https://dataworks.calderdale.gov.uk/download/2kyp8/hcj/listed%20buildings%20west%20yorkshire.json';
const MARKER_ICON_ID = 'custom-marker';

type ListedBuilding = { Name?: string; Grade?: string };
type Sources = {
    heatmap: FeatureCollection<Point, ListedBuilding>;
    markers: FeatureCollection<Point, ListedBuilding>;
};

const createMarkerIcon = (size: number): ImageData => {
    const canvas = document.createElement('canvas');
    canvas.width = size;
    canvas.height = size;
    const context = canvas.getContext('2d') as CanvasRenderingContext2D;
    const center = size / 2;
    context.beginPath();
    context.arc(center, center, center - 1.5, 0, Math.PI * 2);
    context.fillStyle = '#0a3653';
    context.fill();
    context.lineWidth = 1.5;
    context.strokeStyle = '#ffffff';
    context.stroke();
    return context.getImageData(0, 0, size, size);
};

const initSelectionPanel = (customGeoJSON: CustomGeoJSONModule<Sources>) => {
    const selection = document.querySelector('#sdk-example-selection') as HTMLDivElement;

    customGeoJSON.events.markers.on('hover', (feature) => {
        const { Name } = (feature.properties ?? {}) as ListedBuilding;
        selection.innerHTML = `<strong>Hovering</strong>${Name ?? '(no name)'}`;
    });

    customGeoJSON.events.markers.on('click', (feature, lngLat) => {
        const { Name, Grade } = (feature.properties ?? {}) as ListedBuilding;
        selection.innerHTML =
            `<strong>${Name ?? '(no name)'}</strong>` +
            `${Grade ? `Grade ${Grade} · ` : ''}${lngLat.lng.toFixed(4)}, ${lngLat.lat.toFixed(4)}`;
    });
};

const initStyleSelector = () => {
    const selector = document.querySelector('#sdk-example-mapStyles') as HTMLSelectElement;
    standardStyleIDs.forEach((id) => selector.add(new Option(id)));
    selector.addEventListener('change', (event) =>
        map.setStyle((event.target as HTMLOptionElement).value as StandardStyleID),
    );
};

(async () => {
    const customGeoJSON = await CustomGeoJSONModule.get<Sources>(map, {
        sources: {
            heatmap: { layers: heatmapLayers },
            markers: { layers: buildMarkersLayers(MARKER_ICON_ID) },
        },
        images: { [MARKER_ICON_ID]: { image: createMarkerIcon(32), options: { pixelRatio: 2 } } },
    });

    await customGeoJSON.show(await (await fetch(DATA_URL)).json());

    initSelectionPanel(customGeoJSON);
    initStyleSelector();
    initTogglePanel();
})();
