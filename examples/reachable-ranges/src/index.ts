import { TomTomConfig } from '@tomtom-org/maps-sdk/core';
import {
    type ColorPaletteOptions,
    GeometriesModule,
    type GeometryBeforeLayerConfig,
    type GeometryTheme,
    PlacesModule,
    reachableRangeGeometryConfig,
    type StandardStyleID,
    TomTomMap,
} from '@tomtom-org/maps-sdk/map';
import { type BudgetType, calculateReachableRanges } from '@tomtom-org/maps-sdk/services';
import type { LngLatBoundsLike } from 'maplibre-gl';
import './style.css';
import { API_KEY } from './config';
import { getBudgetsForMax, initControls, setStatus } from './controls';
import { getVehicleForBudgetType } from './vehicleProfiles';

// (Set your own API key when working in your own environment)
TomTomConfig.instance.put({ apiKey: API_KEY });

let origin: [number, number] = [4.7641, 52.3086];
let currentTheme: GeometryTheme = 'filled';
let currentPalette: ColorPaletteOptions = 'fadedRainbow';
let currentBudgetType: BudgetType = 'timeMinutes';
let currentBeforeLayer: GeometryBeforeLayerConfig = 'lowestLabel';
let maxBudget = 30;

const map = new TomTomMap({
    style: 'monoDark',
    mapLibre: { container: 'sdk-map', center: origin, zoom: 9 },
});

(async () => {
    const originPin = await PlacesModule.get(map);
    const geometriesModule = await GeometriesModule.get(
        map,
        reachableRangeGeometryConfig(currentPalette, currentTheme, currentBeforeLayer),
    );

    let lastResult: Awaited<ReturnType<typeof calculateReachableRanges>> | null = null;
    let abortController = new AbortController();

    const formatCoords = ([lng, lat]: [number, number]) => `${lat.toFixed(4)}, ${lng.toFixed(4)}`;

    const isInvertedTheme = (theme: GeometryTheme) => theme === 'inverted';

    const updateRanges = async (fitBounds = true) => {
        abortController.abort();
        abortController = new AbortController();
        setStatus('', true);

        try {
            const result = await calculateReachableRanges(
                getBudgetsForMax(maxBudget, currentBudgetType, isInvertedTheme(currentTheme)).map((value) => ({
                    origin,
                    budget: { type: currentBudgetType, value },
                    vehicle: getVehicleForBudgetType(currentBudgetType),
                })),
                { signal: abortController.signal },
            );

            if (!result.features.length) {
                geometriesModule.clear();
                setStatus('No ranges found for this location.');
                return;
            }

            lastResult = result;
            geometriesModule.show(result);

            if (fitBounds && result.bbox) {
                map.mapLibreMap.fitBounds(result.bbox as LngLatBoundsLike, { padding: 50 });
            }

            setStatus('');
        } catch {
            // AbortError — a newer call is already in flight
        }
    };

    const refreshDisplay = () => {
        if (lastResult?.features.length) {
            geometriesModule.applyConfig(
                reachableRangeGeometryConfig(currentPalette, currentTheme, currentBeforeLayer),
            );
            void geometriesModule.show(lastResult);
        }
    };

    const showPin = (lngLat: [number, number], label = '') => {
        originPin.show({
            type: 'Feature',
            id: 'origin',
            geometry: { type: 'Point', coordinates: lngLat },
            properties: { type: 'Point Address', address: { freeformAddress: label } },
        });
    };

    const setOrigin = (lngLat: [number, number], label?: string) => {
        origin = lngLat;
        showPin(lngLat, label);
        updateRanges();
    };

    const controls = initControls(map, {
        onOriginSelected: (lngLat, displayName) => setOrigin(lngLat, displayName),
        onBudgetTypeChange: (type, newMax) => {
            currentBudgetType = type;
            maxBudget = newMax;
            updateRanges();
        },
        onMaxBudgetChange: (max) => {
            maxBudget = max;
            updateRanges();
        },
        onPaletteChange: (palette) => {
            currentPalette = palette;
            refreshDisplay();
        },
        onThemeChange: (theme) => {
            currentTheme = theme;
            refreshDisplay();
        },
        onStyleChange: (styleId: StandardStyleID) => {
            map.setStyle(styleId);
        },
        onBeforeLayerChange: (beforeLayer) => {
            currentBeforeLayer = beforeLayer;
            geometriesModule.moveBeforeLayer(beforeLayer);
        },
    });

    // Click/touch on map to relocate origin
    map.mapLibreMap.on('click', (e) => {
        const lngLat = e.lngLat.toArray() as [number, number];
        controls.setOriginInput(formatCoords(lngLat));
        setOrigin(lngLat);
    });

    showPin(origin);
    controls.setOriginInput(formatCoords(origin));
    updateRanges();
})();
