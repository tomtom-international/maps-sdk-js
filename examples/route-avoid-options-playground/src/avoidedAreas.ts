import type { BBox } from '@tomtom-org/maps-sdk/core';
import { polygonFromBBox } from '@tomtom-org/maps-sdk/core';
import { mapStyleLayerIDs } from '@tomtom-org/maps-sdk/map';
import { type GeoJSONSource, type Map as MapLibreMap, Popup } from 'maplibre-gl';

export type AvoidedArea = { bbox: BBox; label: string };

const SOURCE_ID = 'avoid-areas';
const FILL_LAYER_ID = 'avoid-areas-fill';
const LINE_LAYER_ID = 'avoid-areas-line';
const LABEL_LAYER_ID = 'avoid-areas-label';

export const setupAvoidedAreas = (
    mapLibreMap: MapLibreMap,
    onRemove: (index: number) => void,
    onSuppressMapClick: () => void,
) => {
    let areas: AvoidedArea[] = [];
    let clearPopup: Popup | null = null;

    const closeClearPopup = () => {
        clearPopup?.remove();
        clearPopup = null;
    };

    // --- MapLibre source & layers ---
    mapLibreMap.addSource(SOURCE_ID, {
        type: 'geojson',
        data: { type: 'FeatureCollection', features: [] },
    });
    mapLibreMap.addLayer(
        {
            id: FILL_LAYER_ID,
            type: 'fill',
            source: SOURCE_ID,
            paint: { 'fill-color': '#df1b12', 'fill-opacity': 0.07 },
        },
        mapStyleLayerIDs.lowestRoadLine,
    );
    mapLibreMap.addLayer(
        {
            id: LINE_LAYER_ID,
            type: 'line',
            source: SOURCE_ID,
            paint: { 'line-color': '#df1b12', 'line-dasharray': [3, 3] },
        },
        mapStyleLayerIDs.lowestRoadLine,
    );
    mapLibreMap.addLayer({
        id: LABEL_LAYER_ID,
        type: 'symbol',
        source: SOURCE_ID,
        layout: {
            'text-field': ['get', 'label'],
            'text-size': 12,
            'text-anchor': 'center',
        },
        paint: {
            'text-color': '#df1b12',
            'text-halo-color': '#ffffff',
            'text-halo-width': 1,
        },
    });

    mapLibreMap.on('mouseenter', FILL_LAYER_ID, () => {
        mapLibreMap.getCanvas().style.cursor = 'pointer';
    });
    mapLibreMap.on('mouseleave', FILL_LAYER_ID, () => {
        mapLibreMap.getCanvas().style.cursor = '';
    });

    // "Clear" popup on rectangle click
    mapLibreMap.on('click', FILL_LAYER_ID, (e) => {
        const index: number | undefined = e.features?.[0]?.properties?.index;
        if (index == null) return;
        onSuppressMapClick();
        closeClearPopup();
        const popup = new Popup({ closeButton: false, anchor: 'bottom', className: 'avoid-section-popup' })
            .setLngLat(e.lngLat)
            .setHTML(`<button class="sdk-example-button avoid-popup-btn">Clear</button>`)
            .addTo(mapLibreMap);
        clearPopup = popup;
        popup
            .getElement()
            .querySelector('.avoid-popup-btn')
            ?.addEventListener('click', () => {
                closeClearPopup();
                onRemove(index);
            });
    });

    // --- Map source update ---
    const updateMap = () => {
        (mapLibreMap.getSource(SOURCE_ID) as GeoJSONSource).setData({
            type: 'FeatureCollection',
            features: areas.map((area, i) => ({
                ...polygonFromBBox(area.bbox),
                properties: { index: i, label: area.label },
            })),
        });
    };

    // --- DOM list update ---
    const renderList = () => {
        const list = document.getElementById('avoid-areas-list') as HTMLUListElement;
        const empty = document.getElementById('avoid-areas-empty') as HTMLParagraphElement;
        list.innerHTML = '';
        empty.style.display = areas.length === 0 ? 'block' : 'none';

        areas.forEach(({ label }, index) => {
            const li = document.createElement('li');
            li.className = 'avoid-area-item';

            const labelEl = document.createElement('span');
            labelEl.className = 'avoid-area-label';
            labelEl.textContent = label;

            const removeBtn = document.createElement('button');
            removeBtn.className = 'sdk-example-button sdk-example-button-ghost avoid-area-remove';
            removeBtn.setAttribute('aria-label', `Remove area ${index + 1}`);
            removeBtn.innerHTML = `<svg viewBox="0 0 16 16" fill="none" stroke="currentColor" stroke-width="1.5"><line x1="3" y1="3" x2="13" y2="13"/><line x1="13" y1="3" x2="3" y2="13"/></svg>`;
            removeBtn.addEventListener('click', () => onRemove(index));

            li.appendChild(labelEl);
            li.appendChild(removeBtn);
            list.appendChild(li);
        });
    };

    const update = () => {
        updateMap();
        renderList();
    };

    return {
        get areas(): readonly AvoidedArea[] {
            return areas;
        },
        closeClearPopup,
        add(area: AvoidedArea): void {
            areas = [...areas, area];
            update();
        },
        remove(index: number): void {
            areas = areas.filter((_, i) => i !== index);
            update();
        },
        reset(): void {
            areas = [];
            update();
        },
    };
};
