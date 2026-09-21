import type { RevGeoAddressProps } from '@tomtom-org/maps-sdk/core';
import { TomTomConfig } from '@tomtom-org/maps-sdk/core';
import { BaseMapModule, PlacesModule, TomTomMap } from '@tomtom-org/maps-sdk/map';
import { reverseGeocode } from '@tomtom-org/maps-sdk/services';
import type { Position } from 'geojson';
import { LngLat, LngLatBounds } from 'maplibre-gl';
import { clearConnectingLine, initConnectingLine, updateConnectingLine } from './connectingLine';
import { clearEntryPoints, initEntryPoints, showEntryPoints } from './entryPoints';
import './style.css';
import { API_KEY } from './config';
import { initOptionsPanel, readOptions } from './optionsPanel';
import { showError, showMatch, showNoMatch } from './resultPanel';
import { initTogglePanel } from './togglePanel';

// (Set your own API key when working in your own environment)
TomTomConfig.instance.put({ apiKey: API_KEY });

// A tuple rather than a `Position`, because MapLibre's `center` will not take a `number[]`.
const START_POSITION: [number, number] = [4.8896, 52.37321];

// The right-hand padding keeps a fitted match clear of the panel.
const FIT_PADDING = { top: 60, bottom: 60, left: 60, right: 380 };

const toLngLat = (position: Position): LngLat => new LngLat(position[0], position[1]);

(async () => {
    const map = new TomTomMap({
        mapLibre: {
            container: 'sdk-map',
            center: START_POSITION,
            zoom: 16,
        },
        style: 'monoLight',
    });

    // we wait for the style to be loaded before adding our custom layers
    await map.mapLibreMap.once('styledata');

    initConnectingLine(map.mapLibreMap);
    initEntryPoints(map.mapLibreMap);

    const clickedPlace = await PlacesModule.create(map, { icon: { default: { style: { fillColor: '#ffffff' } } } });
    const matchedPlace = await PlacesModule.create(map, { icon: { default: { style: { fillColor: '#df1b12' } } } });

    let queryPosition: Position = START_POSITION;
    // A slow request must not overwrite the answer to a newer one.
    let latestRequestNumber = 0;

    const showQueryPin = (position: Position) =>
        clickedPlace.show({
            type: 'Feature',
            id: 'clicked-point',
            geometry: { type: 'Point', coordinates: position },
            properties: {
                type: 'Point Address',
                address: { freeformAddress: 'Clicked point' },
            },
        });

    const clearMatch = (): void => {
        matchedPlace.clear();
        clearConnectingLine(map.mapLibreMap);
        clearEntryPoints(map.mapLibreMap);
    };

    const keepMatchOnScreen = (matchedPosition: Position): void => {
        if (map.mapLibreMap.getBounds().contains(toLngLat(matchedPosition))) return;

        map.mapLibreMap.fitBounds(new LngLatBounds(toLngLat(queryPosition), toLngLat(matchedPosition)), {
            padding: FIT_PADDING,
        });
    };

    const runReverseGeocode = async (): Promise<void> => {
        const requestNumber = ++latestRequestNumber;

        try {
            const result = await reverseGeocode({ position: queryPosition, ...readOptions() });
            if (requestNumber !== latestRequestNumber) return;

            // With a radius set, the service can answer with the queried point and no properties.
            const match: RevGeoAddressProps | undefined = result.properties;
            if (!match) {
                clearMatch();
                showNoMatch();
                return;
            }

            // The result's geometry is the point that was asked about; `originalPosition` is what
            // the service matched it to.
            await matchedPlace.show({
                ...result,
                geometry: { ...result.geometry, coordinates: match.originalPosition },
            });
            updateConnectingLine(map.mapLibreMap, [queryPosition, match.originalPosition]);
            showEntryPoints(map.mapLibreMap, match.originalPosition, match.entryPoints ?? []);
            showMatch(match, toLngLat(queryPosition).distanceTo(toLngLat(match.originalPosition)));
            keepMatchOnScreen(match.originalPosition);
        } catch (error) {
            if (requestNumber !== latestRequestNumber) return;

            clearMatch();
            showError(error);
        }
    };

    const moveQueryTo = async (position: Position): Promise<void> => {
        queryPosition = position;
        await showQueryPin(position);
        await runReverseGeocode();
    };

    initTogglePanel();
    initOptionsPanel(() => void runReverseGeocode());

    const basemap = await BaseMapModule.get(map);
    basemap.events.on('click', (_feature, clickedLngLat) => void moveQueryTo(clickedLngLat.toArray()));

    await moveQueryTo(START_POSITION);
})();
