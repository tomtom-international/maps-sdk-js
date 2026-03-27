import type { Place } from '@tomtom-org/maps-sdk/core';
import { bboxFromGeoJSON } from '@tomtom-org/maps-sdk/core';
import type { TomTomMap, TrafficAreaAnalyticsModule } from '@tomtom-org/maps-sdk/map';
import { calculateFittingBBox, renderAreaAnalyticsChart } from '@tomtom-org/maps-sdk/map';
import { geocode, geometryData, trafficAreaAnalytics } from '@tomtom-org/maps-sdk/services';
import type { MultiPolygon, Polygon } from 'geojson';
import { MOVE_PORTAL_KEY } from './config';
import { updateStats } from './controls';

function formatDate(date: Date): string {
    return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}-${String(date.getDate()).padStart(2, '0')}`;
}

function getDateRange(days: number): { startDate: string; endDate: string } {
    const end = new Date();
    end.setDate(end.getDate() - 2); // API requires ≥2 days ago
    const start = new Date(end);
    start.setDate(start.getDate() - (days - 1));
    return { startDate: formatDate(start), endDate: formatDate(end) };
}

type CitySearchParams = {
    map: TomTomMap;
    analyticsModule: TrafficAreaAnalyticsModule;
    cityInput: HTMLInputElement;
    suggestionsList: HTMLUListElement;
    bottomPanel: HTMLElement;
    loadingOverlay: HTMLElement;
    heatmapCanvas: HTMLCanvasElement;
};

async function loadAnalytics(
    cityName: string,
    geometry: Polygon | MultiPolygon,
    analyticsModule: TrafficAreaAnalyticsModule,
    bottomPanel: HTMLElement,
    loadingOverlay: HTMLElement,
    heatmapCanvas: HTMLCanvasElement,
): Promise<void> {
    try {
        const { startDate, endDate } = getDateRange(7);
        const analytics = await trafficAreaAnalytics({
            apiKey: MOVE_PORTAL_KEY,
            name: cityName,
            startDate,
            endDate,
            dataTypes: ['SPEED', 'CONGESTION_LEVEL', 'FREE_FLOW_SPEED', 'TRAVEL_TIME'],
            functionalRoadClasses: 'all',
            hours: 'all',
            geometry,
        });

        loadingOverlay.classList.add('aa-hidden');
        const region = analytics.features[0]?.properties;

        if (!region) {
            bottomPanel.classList.add('aa-hidden');
            return;
        }

        await analyticsModule.show(analytics);

        (document.getElementById('panel-city-name') as HTMLElement).textContent = cityName;
        updateStats(region.baseData);

        const hourly = region.timedData?.hourly ?? region.timedData?.average ?? [];

        if (hourly.length) {
            renderAreaAnalyticsChart(heatmapCanvas, hourly, startDate);
        }

        bottomPanel.classList.remove('aa-hidden');
    } catch (error) {
        console.error('Analytics fetch error:', error);
        loadingOverlay.classList.add('aa-hidden');
        bottomPanel.classList.add('aa-hidden');
    }
}

type CitySearchControls = {
    selectCityByName: (name: string, position: [number, number]) => Promise<void>;
};

export function initCitySearch({
    map,
    analyticsModule,
    cityInput,
    suggestionsList,
    bottomPanel,
    loadingOverlay,
    heatmapCanvas,
}: CitySearchParams): CitySearchControls {
    function showSuggestions(places: Place[]): void {
        suggestionsList.innerHTML = '';

        if (!places.length) {
            hideSuggestions();
            return;
        }

        for (const place of places) {
            const listItem = document.createElement('li');
            listItem.textContent = place.properties?.address?.freeformAddress ?? 'Unknown';
            listItem.addEventListener('click', () => selectCity(place));
            suggestionsList.appendChild(listItem);
        }

        suggestionsList.classList.add('visible');
    }

    function hideSuggestions(): void {
        suggestionsList.classList.remove('visible');
        suggestionsList.innerHTML = '';
    }

    async function selectCity(place: Place, moveMap = true): Promise<void> {
        cityInput.value = '';
        hideSuggestions();

        try {
            loadingOverlay.classList.remove('aa-hidden');
            const boundary = await geometryData({ geometries: [place] });
            const contentBBox = bboxFromGeoJSON(boundary);

            if (moveMap) {
                if (contentBBox) {
                    const fittingBBox = calculateFittingBBox({
                        map,
                        toBeContainedBBox: contentBBox,
                        surroundingElements: ['.sdk-example-customPanel', '#bottom-panel'],
                        paddingPX: 60,
                    });

                    if (fittingBBox) {
                        map.mapLibreMap.fitBounds(fittingBBox, { duration: 1500 });
                    }
                } else {
                    map.mapLibreMap.flyTo({
                        center: place.geometry.coordinates as [number, number],
                        zoom: 12,
                        duration: 1500,
                    });
                }
            }

            const geometry = boundary?.features?.[0]?.geometry;

            if (geometry) {
                await loadAnalytics(
                    place.properties?.address?.freeformAddress ?? 'Unknown',
                    geometry,
                    analyticsModule,
                    bottomPanel,
                    loadingOverlay,
                    heatmapCanvas,
                );
            } else {
                loadingOverlay.classList.add('aa-hidden');
            }
        } catch (error) {
            console.error('City selection failed:', error);
            loadingOverlay.classList.add('aa-hidden');
        }
    }

    let debounceTimer: ReturnType<typeof setTimeout>;

    cityInput.addEventListener('input', () => {
        clearTimeout(debounceTimer);
        const query = cityInput.value.trim();

        if (query.length < 2) {
            hideSuggestions();
            return;
        }

        debounceTimer = setTimeout(async () => {
            try {
                showSuggestions((await geocode({ query, limit: 5 })).features ?? []);
            } catch {
                hideSuggestions();
            }
        }, 300);
    });

    document.addEventListener('click', (event) => {
        if (!cityInput.contains(event.target as Node) && !suggestionsList.contains(event.target as Node)) {
            hideSuggestions();
        }
    });

    async function selectCityByName(name: string, position: [number, number]): Promise<void> {
        cityInput.value = name;

        try {
            const results = await geocode({ query: name, position, limit: 1 });
            const place = results.features[0];

            if (place) {
                await selectCity(place, false);
            }
        } catch (error) {
            console.error('Map label city selection failed:', error);
        }
    }

    return { selectCityByName };
}
