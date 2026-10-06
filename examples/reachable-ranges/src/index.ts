import { type BudgetType, TomTomConfig } from '@tomtom-org/maps-sdk/core';
import {
    type GeometryBeforeLayerConfig,
    type GeometryFillStyle,
    PlacesModule,
    ReachableRangesModule,
    type ReachableRangesModuleConfig,
    type StandardStyleID,
    TomTomMap,
} from '@tomtom-org/maps-sdk/map';
import { calculateReachableRanges, createLatestRequest } from '@tomtom-org/maps-sdk/services';
import type { LngLatBoundsLike } from 'maplibre-gl';
import './style.css';
import { API_KEY } from './config';
import { getBudgetsForMax, initControls, setStatus } from './controls';

// (Set your own API key when working in your own environment)
TomTomConfig.instance.put({ apiKey: API_KEY });

let origin: [number, number] = [4.7641, 52.3086];
let currentFillStyle: GeometryFillStyle = 'filled';
// Empty: the bands ramp from the map's accent toward its land colour.
let currentPalette: string[] = [];
let currentBudgetType: BudgetType = 'timeMinutes';
let currentBeforeLayer: GeometryBeforeLayerConfig = 'lowestLabel';
let maxBudget = 30;

const map = new TomTomMap({
    style: 'monoDark',
    mapLibre: { container: 'sdk-map', center: origin, zoom: 9 },
});

(async () => {
    const originPin = await PlacesModule.create(map);
    const rangesConfig = (): ReachableRangesModuleConfig => ({
        fill: { style: currentFillStyle, palette: currentPalette },
        beforeLayerConfig: currentBeforeLayer,
    });
    const rangesModule = await ReachableRangesModule.create(map, rangesConfig());

    // A fresh click retires the calculation still in flight for the previous origin
    const latestRanges = createLatestRequest();

    const formatCoords = ([lng, lat]: [number, number]) => `${lat.toFixed(4)}, ${lng.toFixed(4)}`;

    const isInvertedFillStyle = (fillStyle: GeometryFillStyle) => fillStyle === 'inverted';

    const updateRanges = async (fitBounds = true) => {
        setStatus('', true);

        try {
            const ranges = await latestRanges.run((signal) =>
                calculateReachableRanges(
                    getBudgetsForMax(maxBudget, currentBudgetType, isInvertedFillStyle(currentFillStyle)).map(
                        (value) => ({
                            origin,
                            budget: { type: currentBudgetType, value },
                        }),
                    ),
                    { signal },
                ),
            );
            if (!ranges.current) return;

            const result = ranges.value;
            if (!result.features.length) {
                rangesModule.clear();
                setStatus('No ranges found for this location.');
                return;
            }

            rangesModule.show(result);

            if (fitBounds && result.bbox) {
                map.mapLibreMap.fitBounds(result.bbox as LngLatBoundsLike, { padding: 50 });
            }

            setStatus('');
        } catch {
            setStatus('Could not calculate reachable ranges.');
        }
    };

    // Restyles the ranges already shown: no new calculation, no new show().
    const refreshDisplay = () => rangesModule.applyConfig(rangesConfig());

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
        onFillStyleChange: (fillStyle) => {
            currentFillStyle = fillStyle;
            refreshDisplay();
        },
        onStyleChange: (styleId: StandardStyleID) => {
            map.setStyle(styleId);
        },
        onBeforeLayerChange: (beforeLayer) => {
            currentBeforeLayer = beforeLayer;
            rangesModule.updateConfig({ beforeLayerConfig: beforeLayer });
        },
    });

    // Click/touch on map to relocate origin
    map.mapLibreMap.on('click', (e) => {
        const lngLat = e.lngLat.toArray();
        controls.setOriginInput(formatCoords(lngLat));
        setOrigin(lngLat);
    });

    showPin(origin);
    controls.setOriginInput(formatCoords(origin));
    updateRanges();
})();
