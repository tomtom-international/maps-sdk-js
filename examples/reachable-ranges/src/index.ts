import { TomTomConfig } from '@tomtom-org/maps-sdk/core';
import {
    type ColorPaletteOptions,
    GeometriesModule,
    PlacesModule,
    prepareReachableRangesForDisplay,
    type ReachableRangeTheme,
    reachableRangeLayerConfig,
    type StandardStyleID,
    TomTomMap,
} from '@tomtom-org/maps-sdk/map';
import { type BudgetType, calculateReachableRanges } from '@tomtom-org/maps-sdk/services';
import type { LngLatBoundsLike } from 'maplibre-gl';
import './style.css';
import { API_KEY } from './config';
import { BUDGET_UNITS, getBudgetsForMax, initControls, setStatus } from './controls';
import { getVehicleForBudgetType } from './vehicleProfiles';

// (Set your own API key when working in your own environment)
TomTomConfig.instance.put({ apiKey: API_KEY });

let origin: [number, number] = [4.7641, 52.3086];
let currentTheme: ReachableRangeTheme = 'filled';
let currentPalette: ColorPaletteOptions = 'fadedRainbow';
let currentBudgetType: BudgetType = 'timeMinutes';
let maxBudget = 30;

const map = new TomTomMap({
    style: 'monoDark',
    mapLibre: { container: 'sdk-map', center: origin, zoom: 9 },
});

(async () => {
    const originPin = await PlacesModule.get(map);

    let rangesModule: GeometriesModule | null = null;
    let abortController = new AbortController();

    const updateRanges = async (fitBounds = true) => {
        abortController.abort();
        abortController = new AbortController();
        setStatus('', true);

        try {
            const { features } = await calculateReachableRanges(
                getBudgetsForMax(maxBudget, currentBudgetType).map((value) => ({
                    origin,
                    budget: { type: currentBudgetType, value },
                    smoothing: 'strong',
                    vehicle: getVehicleForBudgetType(currentBudgetType),
                })),
                { signal: abortController.signal },
            );

            if (!features.length) {
                rangesModule?.clear();
                setStatus('No ranges found for this location.');
                return;
            }

            const displayRanges = prepareReachableRangesForDisplay(
                features,
                features.map((f) => `${f.properties.budget.value} ${BUDGET_UNITS[currentBudgetType]}`),
                currentTheme,
            );

            if (!rangesModule) {
                rangesModule = await GeometriesModule.get(map, reachableRangeLayerConfig(currentPalette));
            } else {
                rangesModule.applyConfig(reachableRangeLayerConfig(currentPalette));
            }

            rangesModule.show(displayRanges);

            if (fitBounds && displayRanges.bbox) {
                map.mapLibreMap.fitBounds(displayRanges.bbox as LngLatBoundsLike, { padding: 50 });
            }

            setStatus('');
        } catch {
            // AbortError — a newer call is already in flight
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

    // Click/touch on map to relocate origin
    map.mapLibreMap.on('click', (e) => {
        setOrigin(e.lngLat.toArray());
    });

    initControls(map, {
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
            updateRanges(false);
        },
        onThemeChange: (theme) => {
            currentTheme = theme;
            updateRanges(false);
        },
        onStyleChange: (styleId: StandardStyleID) => {
            map.setStyle(styleId);
        },
    });

    showPin(origin);
    updateRanges();
})();
