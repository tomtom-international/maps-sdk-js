import { bboxFromGeoJSON, TomTomConfig } from '@tomtom-org/maps-sdk/core';
import {
    BaseMapModule,
    GeometriesModule,
    TomTomMap,
    TrafficIncidentDetailsModule,
    trafficIncidentDetailsKnobCatalogue,
} from '@tomtom-org/maps-sdk/map';
import { geocodeOne, geometryData, trafficIncidentDetails } from '@tomtom-org/maps-sdk/services';
import type { LngLatBoundsLike } from 'maplibre-gl';
import './style.css';
import { API_KEY } from './config';
import { initKnobPanel } from './knobPanel';
import { buildPopupHTML, createIncidentPopup } from './popup';

TomTomConfig.instance.put({ apiKey: API_KEY, language: 'en-GB' });

const INITIAL_QUERY = 'London';

(async () => {
    const searchBox = document.getElementById('ui-searchBox') as HTMLInputElement;
    const searchButton = document.getElementById('ui-searchButton') as HTMLButtonElement;
    const statusElement = document.getElementById('ui-status') as HTMLDivElement;

    const map = new TomTomMap({
        mapLibre: {
            container: 'sdk-map',
            center: [-0.13, 51.51],
            zoom: 11,
        },
    });

    const incidentDetailsModule = await TrafficIncidentDetailsModule.create(map);
    initKnobPanel('ui-knobs', trafficIncidentDetailsKnobCatalogue, incidentDetailsModule);
    const baseMap = await BaseMapModule.get(map);
    const boundaryOutline = await GeometriesModule.create(map, {
        fill: { style: 'outline' },
        line: { width: 2 },
        layers: { line: { paint: { 'line-dasharray': [2, 2] } } },
    });
    const popup = createIncidentPopup();

    incidentDetailsModule.events.on('click', (incident, lngLat) => {
        if (incident.properties.id) {
            incidentDetailsModule.setFocus([incident.properties.id]);
        }
        popup.setHTML(buildPopupHTML(incident)).setLngLat(lngLat).addTo(map.mapLibreMap);
    });

    // Clear focus + popup when the user clicks the basemap (i.e. outside any incident).
    baseMap.events.on('click', () => {
        incidentDetailsModule.setFocus(null);
        popup.remove();
    });

    const setStatus = (text: string, state?: 'error') => {
        statusElement.textContent = text;
        if (state) {
            statusElement.dataset.state = state;
        } else {
            delete statusElement.dataset.state;
        }
    };

    const renderIncidentsFor = async (query: string) => {
        setStatus(`Searching '${query}'…`);
        popup.remove();
        try {
            const place = await geocodeOne(query);
            // A city boundary clips the incidents to its shape; without one, or if it fails to load, the bbox is queried
            const boundary = place.properties.dataSources?.geometry
                ? await geometryData({ geometries: [place] }).catch(() => undefined)
                : undefined;
            const area = boundary?.features.length ? { polygon: boundary } : { bbox: place };
            const result = await trafficIncidentDetails({ ...area, timeValidityFilter: ['present'] });
            await incidentDetailsModule.show(result);
            if (boundary) {
                await boundaryOutline.show(boundary);
            } else {
                await boundaryOutline.clear();
            }

            map.mapLibreMap.fitBounds(bboxFromGeoJSON(place) as LngLatBoundsLike, {
                padding: 60,
                duration: 600,
            });
            const placeName = place.properties.address.freeformAddress ?? query;
            setStatus(
                result.features.length === 0
                    ? `No current incidents in ${placeName}.`
                    : `${result.features.length} incident${result.features.length === 1 ? '' : 's'} in ${placeName}. Click one for details.`,
            );
        } catch (error) {
            setStatus(error instanceof Error ? error.message : 'Search failed', 'error');
        }
    };

    const triggerSearch = () => {
        const query = searchBox.value.trim();
        if (query) {
            void renderIncidentsFor(query);
        }
    };

    searchButton.addEventListener('click', triggerSearch);
    searchBox.addEventListener('keypress', (event) => {
        if (event.key === 'Enter') triggerSearch();
    });

    searchBox.value = INITIAL_QUERY;
    void renderIncidentsFor(INITIAL_QUERY);
})();
