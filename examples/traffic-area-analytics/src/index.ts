import type { Place } from '@tomtom-org/maps-sdk/core';
import { TomTomConfig } from '@tomtom-org/maps-sdk/core';
import type { AreaAnalyticsColorScheme, AreaAnalyticsMetricKey } from '@tomtom-org/maps-sdk/map';
import { GeometriesModule, TomTomMap, TrafficAreaAnalyticsModule, renderAreaAnalyticsChart } from '@tomtom-org/maps-sdk/map';
import { geocode, geometryData, trafficAreaAnalytics } from '@tomtom-org/maps-sdk/services';

import { updateLegend, updateStats, wireRadioGroup } from './controls';
import './style.css';

// ── Config ───────────────────────────────────────────────────────────
const API_KEY = process.env.API_KEY_EXAMPLES;
const MOVE_PORTAL_KEY = process.env.MOVE_PORTAL_KEY;

TomTomConfig.instance.put({ apiKey: API_KEY, language: 'en-US' });

// ── DOM refs ─────────────────────────────────────────────────────────
const $ = (id: string) => document.getElementById(id)!;
const cityInput = $('city-input') as HTMLInputElement;
const suggestionsList = $('city-suggestions') as HTMLUListElement;
const bottomPanel = $('bottom-panel');
const loadingOverlay = $('loading-overlay');
const tooltip = $('tile-tooltip');
const heatmapCanvas = $('heatmap-canvas') as HTMLCanvasElement;

// ── Helpers ──────────────────────────────────────────────────────────
function formatDate(d: Date): string {
    return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
}

function getDateRange(days: number) {
    const end = new Date();
    end.setDate(end.getDate() - 2); // API requires ≥2 days ago
    const start = new Date(end);
    start.setDate(start.getDate() - (days - 1));
    return { startDate: formatDate(start), endDate: formatDate(end) };
}

// ── Main ─────────────────────────────────────────────────────────────
(async () => {
    // Wait one frame for Vite's CSS injection to apply before creating the map
    await new Promise((r) => requestAnimationFrame(r));

    const map = new TomTomMap({
        style: 'standardLight',
        language: 'en-GB',
        mapLibre: { container: 'sdk-map', center: [-3.7038, 40.4168], zoom: 12, pitch: 45, bearing: -17 },
    });

    const geometriesModule = await GeometriesModule.get(map, { theme: 'inverted' });
    const analyticsModule = await TrafficAreaAnalyticsModule.get(map, { mode: 'hexgrid', metric: 'congestionLevel' });

    // ── City search (debounced geocode) ──────────────────────────────
    let timer: ReturnType<typeof setTimeout>;

    cityInput.addEventListener('input', () => {
        clearTimeout(timer);
        const q = cityInput.value.trim();
        if (q.length < 2) { hideSuggestions(); return; }
        timer = setTimeout(async () => {
            try {
                showSuggestions((await geocode({ query: q, limit: 5 })).features ?? []);
            } catch { hideSuggestions(); }
        }, 300);
    });

    function showSuggestions(places: Place[]) {
        suggestionsList.innerHTML = '';
        if (!places.length) { hideSuggestions(); return; }
        for (const p of places) {
            const li = document.createElement('li');
            li.textContent = p.properties?.address?.freeformAddress ?? 'Unknown';
            li.addEventListener('click', () => selectCity(p));
            suggestionsList.appendChild(li);
        }
        suggestionsList.classList.add('visible');
    }

    function hideSuggestions() {
        suggestionsList.classList.remove('visible');
        suggestionsList.innerHTML = '';
    }

    document.addEventListener('click', (e) => {
        if (!cityInput.contains(e.target as Node) && !suggestionsList.contains(e.target as Node)) hideSuggestions();
    });

    async function selectCity(place: Place) {
        cityInput.value = '';
        hideSuggestions();

        try {
            loadingOverlay.classList.remove('aa-hidden');
            const boundary = await geometryData({ geometries: [place] });
            const bbox = boundary?.bbox;

            if (bbox && bbox.length >= 4) {
                map.mapLibreMap.fitBounds([bbox[0], bbox[1], bbox[2], bbox[3]] as [number, number, number, number],
                    { padding: { top: 60, bottom: 80, left: 60, right: 60 }, duration: 1500 });
            } else {
                map.mapLibreMap.flyTo({ center: place.geometry.coordinates as [number, number], zoom: 12, duration: 1500 });
            }

            await geometriesModule.show(boundary);

            const geom = boundary?.features?.[0]?.geometry;
            if (geom) await loadAnalytics(place.properties?.address?.freeformAddress ?? 'Unknown', geom);
            else loadingOverlay.classList.add('aa-hidden');
        } catch (err) {
            console.error('City selection failed:', err);
            loadingOverlay.classList.add('aa-hidden');
        }
    }

    // ── Analytics fetch + render ─────────────────────────────────────
    async function loadAnalytics(cityName: string, geometry: GeoJSON.Polygon | GeoJSON.MultiPolygon) {
        try {
            const { startDate, endDate } = getDateRange(7);
            const analytics = await trafficAreaAnalytics({
                apiKey: MOVE_PORTAL_KEY,
                name: cityName,
                startDate, endDate,
                dataTypes: ['SPEED', 'CONGESTION_LEVEL', 'FREE_FLOW_SPEED', 'TRAVEL_TIME'],
                functionalRoadClasses: 'all',
                hours: 'all',
                geometry,
            });

            loadingOverlay.classList.add('aa-hidden');
            const region = analytics.features[0]?.properties;
            if (!region) { bottomPanel.classList.add('aa-hidden'); return; }

            await analyticsModule.show(analytics);

            $('panel-city-name').textContent = cityName;
            updateStats(region.baseData);

            const hourly = region.timedData?.hourly ?? region.timedData?.average ?? [];
            if (hourly.length) renderAreaAnalyticsChart(heatmapCanvas, hourly, startDate);

            bottomPanel.classList.remove('aa-hidden');
        } catch (err) {
            console.error('Analytics fetch error:', err);
            loadingOverlay.classList.add('aa-hidden');
            bottomPanel.classList.add('aa-hidden');
        }
    }

    // ── Metric selector ──────────────────────────────────────────────
    wireRadioGroup('#metric-selector', (value) => {
        analyticsModule.setMetric(value as AreaAnalyticsMetricKey);
        updateLegend(value as AreaAnalyticsMetricKey, analyticsModule.getConfig()?.colorScheme);
    });

    // ── Mode selector ────────────────────────────────────────────────
    wireRadioGroup('#mode-selector', (value) => {
        analyticsModule.setMode(value as 'heatmap' | 'hexgrid');
    });

    // ── Color scheme selector ────────────────────────────────────────
    wireRadioGroup('#color-scheme-selector', (value) => {
        const scheme = value as AreaAnalyticsColorScheme;
        analyticsModule.setColorScheme(scheme);
        updateLegend(analyticsModule.getConfig()?.metric ?? 'congestionLevel', scheme);
    });

    // ── Hex hover tooltip ────────────────────────────────────────────
    analyticsModule.events.on('hover', (feature, lngLat) => {
        const p = feature.properties;
        tooltip.innerHTML = `
            <div class="aa-tooltip-row"><span class="aa-tooltip-label">Congestion</span><span class="aa-tooltip-value">${p.congestionLevel ?? 0}%</span></div>
            <div class="aa-tooltip-row"><span class="aa-tooltip-label">Speed</span><span class="aa-tooltip-value">${p.speed ?? 0} km/h</span></div>
            <div class="aa-tooltip-row"><span class="aa-tooltip-label">Free Flow</span><span class="aa-tooltip-value">${p.freeFlowSpeed ?? 0} km/h</span></div>
            <div class="aa-tooltip-row"><span class="aa-tooltip-label">Travel Time</span><span class="aa-tooltip-value">${p.travelTime ?? 0} min/10km</span></div>
        `;
        tooltip.classList.remove('aa-hidden');
        const pt = map.mapLibreMap.project(lngLat);
        tooltip.style.left = `${pt.x + 12}px`;
        tooltip.style.top = `${pt.y - 12}px`;
    });

    // Hide tooltip when mouse leaves the map
    map.mapLibreMap.getCanvas().addEventListener('mouseleave', () => {
        tooltip.classList.add('aa-hidden');
    });

})();
