import type { Place } from '@tomtom-org/maps-sdk/core';
import type { TomTomMap, TrafficAreaAnalyticsModule } from '@tomtom-org/maps-sdk/map';
import { calculateFittingBBox, renderAreaAnalyticsChart } from '@tomtom-org/maps-sdk/map';
import { geocode, geometryData, trafficAreaAnalytics } from '@tomtom-org/maps-sdk/services';
import type { MultiPolygon, Polygon, Position } from 'geojson';
import { MOVE_PORTAL_KEY } from './config';
import { updateStats } from './controls';

function pastDateRange(days: number): { startDate: string; endDate: string } {
    const end = new Date();
    end.setDate(end.getDate() - 2); // API requires ≥2 days ago
    const start = new Date(end);
    start.setDate(start.getDate() - (days - 1));
    const fmt = (d: Date) => d.toISOString().slice(0, 10);
    return { startDate: fmt(start), endDate: fmt(end) };
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
        const { startDate, endDate } = pastDateRange(7);
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
    selectCityByName: (name: string, position: Position) => Promise<void>;
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
            if (moveMap) {
                const fittingBBox = calculateFittingBBox({
                    map,
                    toBeContainedBBox: place.bbox!,
                    surroundingElements: ['.sdk-example-customPanel', '#bottom-panel'],
                    paddingPX: 60,
                });

                if (fittingBBox) {
                    map.mapLibreMap.fitBounds(fittingBBox, { duration: 1500 });
                }
            }

            const boundary = await geometryData({ geometries: [place] });
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
                showSuggestions((await geocode({ query, limit: 3, geographyTypes: ['Municipality'] })).features ?? []);
            } catch {
                hideSuggestions();
            }
        }, 300);
    });

    cityInput.addEventListener('keydown', (event) => {
        if (event.key !== 'Enter') return;
        event.preventDefault();
        const first = suggestionsList.querySelector('li');
        if (first) first.click();
    });

    document.addEventListener('click', (event) => {
        if (!cityInput.contains(event.target as Node) && !suggestionsList.contains(event.target as Node)) {
            hideSuggestions();
        }
    });

    async function selectCityByName(name: string, position: Position): Promise<void> {
        cityInput.value = name;

        try {
            const results = await geocode({ query: name, position, limit: 1, geographyTypes: ['Municipality'] });
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
