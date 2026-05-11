import { bboxFromGeoJSON, TomTomConfig } from '@tomtom-org/maps-sdk/core';
import { BaseMapModule, TomTomMap, TrafficIncidentOverlayModule } from '@tomtom-org/maps-sdk/map';
import { geocodeOne, trafficIncidentDetails } from '@tomtom-org/maps-sdk/services';
import type { LngLatBoundsLike } from 'maplibre-gl';
import './style.css';
import { API_KEY } from './config';
import { buildPopupHTML, createIncidentPopup } from './popup';

TomTomConfig.instance.put({ apiKey: API_KEY, language: 'en-GB' });

const INITIAL_QUERY = 'London';

(async () => {
    const searchBox = document.getElementById('sdk-example-searchBox') as HTMLInputElement;
    const searchButton = document.getElementById('sdk-example-searchButton') as HTMLButtonElement;
    const statusElement = document.getElementById('sdk-example-status') as HTMLDivElement;

    const map = new TomTomMap({
        mapLibre: {
            container: 'sdk-map',
            center: [-0.13, 51.51],
            zoom: 11,
        },
    });

    const overlay = await TrafficIncidentOverlayModule.get(map);
    const baseMap = await BaseMapModule.get(map);
    const popup = createIncidentPopup();

    overlay.events.on('click', (incident, lngLat) => {
        if (incident.properties.id) {
            overlay.setFocus([incident.properties.id]);
        }
        popup.setHTML(buildPopupHTML(incident)).setLngLat(lngLat).addTo(map.mapLibreMap);
    });

    // Clear focus + popup when the user clicks the basemap (i.e. outside any incident).
    baseMap.events.on('click', () => {
        overlay.setFocus(null);
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
            const result = await trafficIncidentDetails({
                bbox: place,
                timeValidityFilter: ['present'],
            });
            await overlay.show(result);
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
