import type { AreaAnalyticsTimedEntry, Place } from '@tomtom-org/maps-sdk/core';
import type { AreaAnalyticsColorStopsConfig, TomTomMap, TrafficAreaAnalyticsModule } from '@tomtom-org/maps-sdk/map';
import { calculateFittingBBox } from '@tomtom-org/maps-sdk/map';
import { geocode, geometryData, trafficAreaAnalytics } from '@tomtom-org/maps-sdk/services';
import type { MultiPolygon, Polygon, Position } from 'geojson';
import { renderAreaAnalyticsChart } from './areaAnalyticsChart';
import { MOVE_PORTAL_KEY } from './config';
import { updateStats } from './controls';
import type { AnalyticsFilters } from './filters';

// Extracts ordered CSS color strings from a congestion metric config for use in the chart.
const congestionColorStops = (analyticsModule: TrafficAreaAnalyticsModule): string[] => {
    const config = analyticsModule.getConfig()?.metricConfig?.congestionLevel?.color as
        | AreaAnalyticsColorStopsConfig
        | undefined;
    return config?.stops.map((s) => s.color) ?? ['#2dc653', '#f5a623', '#e03030'];
};

type CitySearchParams = {
    map: TomTomMap;
    analyticsModule: TrafficAreaAnalyticsModule;
    cityInput: HTMLInputElement;
    suggestionsList: HTMLUListElement;
    bottomPanel: HTMLElement;
    loadingOverlay: HTMLElement;
    heatmapContainer: HTMLElement;
    filters: AnalyticsFilters;
};

const loadAnalytics = async (
    cityName: string,
    geometry: Polygon | MultiPolygon,
    analyticsModule: TrafficAreaAnalyticsModule,
    bottomPanel: HTMLElement,
    loadingOverlay: HTMLElement,
    filters: AnalyticsFilters,
    onChartData: (entries: AreaAnalyticsTimedEntry[], startDate: string) => void,
): Promise<void> => {
    try {
        const analytics = await trafficAreaAnalytics({
            apiKey: MOVE_PORTAL_KEY,
            name: cityName,
            startDate: filters.startDate,
            endDate: filters.endDate,
            // Keep metrics: 'all' so the active-metric viz selector can switch freely
            // between metrics without re-fetching.
            metrics: 'all',
            functionalRoadClasses: filters.functionalRoadClasses.length > 0 ? filters.functionalRoadClasses : 'all',
            hours: filters.hours.length > 0 ? filters.hours : 'all',
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
            onChartData(hourly, filters.startDate);
        }

        bottomPanel.classList.remove('aa-hidden');
    } catch (error) {
        console.error('Analytics fetch error:', error);
        loadingOverlay.classList.add('aa-hidden');
        bottomPanel.classList.add('aa-hidden');
    }
};

type CitySearchControls = {
    selectCityByName: (name: string, position: Position) => Promise<void>;
    rerenderChart: () => void;
    reloadCurrent: () => Promise<void>;
    hasCurrent: () => boolean;
};

export const initCitySearch = ({
    map,
    analyticsModule,
    cityInput,
    suggestionsList,
    bottomPanel,
    loadingOverlay,
    heatmapContainer,
    filters,
}: CitySearchParams): CitySearchControls => {
    let lastEntries: AreaAnalyticsTimedEntry[] = [];
    let lastStartDate = '';
    let currentCityName: string | null = null;
    let currentGeometry: Polygon | MultiPolygon | null = null;

    const showSuggestions = (places: Place[]): void => {
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
    };

    const hideSuggestions = (): void => {
        suggestionsList.classList.remove('visible');
        suggestionsList.innerHTML = '';
    };

    const runAnalyticsFor = async (cityName: string, geometry: Polygon | MultiPolygon): Promise<void> => {
        currentCityName = cityName;
        currentGeometry = geometry;
        loadingOverlay.classList.remove('aa-hidden');
        await loadAnalytics(
            cityName,
            geometry,
            analyticsModule,
            bottomPanel,
            loadingOverlay,
            filters,
            (entries, startDate) => {
                lastEntries = entries;
                lastStartDate = startDate;
                renderAreaAnalyticsChart(heatmapContainer, entries, startDate, congestionColorStops(analyticsModule));
            },
        );
    };

    const selectCity = async (place: Place, moveMap = true): Promise<void> => {
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
                await runAnalyticsFor(place.properties?.address?.freeformAddress ?? 'Unknown', geometry);
            } else {
                loadingOverlay.classList.add('aa-hidden');
            }
        } catch (error) {
            console.error('City selection failed:', error);
            loadingOverlay.classList.add('aa-hidden');
        }
    };

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

    const selectCityByName = async (name: string, position: Position): Promise<void> => {
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
    };

    const rerenderChart = (): void => {
        if (lastEntries.length) {
            renderAreaAnalyticsChart(
                heatmapContainer,
                lastEntries,
                lastStartDate,
                congestionColorStops(analyticsModule),
            );
        }
    };

    const reloadCurrent = async (): Promise<void> => {
        if (currentCityName && currentGeometry) {
            await runAnalyticsFor(currentCityName, currentGeometry);
        }
    };

    const hasCurrent = (): boolean => currentCityName !== null && currentGeometry !== null;

    return { selectCityByName, rerenderChart, reloadCurrent, hasCurrent };
};
