import { TomTomConfig } from '@tomtom-org/maps-sdk/core';
import { BaseMapModule, PlacesModule, TomTomMap } from '@tomtom-org/maps-sdk/map';
import { reverseGeocode } from '@tomtom-org/maps-sdk/services';
import { LngLat } from 'maplibre-gl';
import { clearConnectingLine, initConnectingLine, updateConnectingLine } from './connectingLine';
import './style.css';
import { API_KEY } from './config';

// (Set your own API key when working in your own environment)
TomTomConfig.instance.put({ apiKey: API_KEY });

(async () => {
    const map = new TomTomMap({ container: 'sdk-map', center: [4.89147, 52.37362], zoom: 17 }, { style: 'monoLight' });
    let isMarkerVisible = false;

    // we wait for the style to be loaded before adding our custom layers
    await map.mapLibreMap.once('styledata');

    // Initialize the connecting line layer
    initConnectingLine(map.mapLibreMap);

    const clickedPlace = await PlacesModule.get(map, { icon: { default: { style: { fillColor: '#ffffff' } } } });
    const revGeoPlace = await PlacesModule.get(map, { icon: { default: { style: { fillColor: '#df1b12' } } } });

    const removeMarkers = () => {
        revGeoPlace.clear();
        clickedPlace.clear();
        clearConnectingLine(map.mapLibreMap);
        isMarkerVisible = false;
    };

    const onMapClick = async (_: any, clickedLngLat: LngLat) => {
        if (isMarkerVisible) {
            removeMarkers();
        } else {
            const clickedPosition = clickedLngLat.toArray();

            // Show clicked coordinates using PlacesModule with white fill
            await clickedPlace.show({
                type: 'Feature',
                geometry: { type: 'Point', coordinates: clickedPosition },
                properties: {
                    address: {
                        freeformAddress: `Clicked on\n${clickedLngLat.lng.toFixed(5)}, ${clickedLngLat.lat.toFixed(5)}`,
                    },
                },
            });

            // Get the entire reverse geocoded object and show it using PlacesModule
            const revGeoResult = await reverseGeocode({ position: clickedPosition });
            await revGeoPlace.show({
                ...revGeoResult,
                geometry: {
                    ...revGeoResult.geometry,
                    coordinates: revGeoResult.properties.originalPosition,
                },
            });

            // Draw the connecting line between clicked point and reverse geocoded position
            updateConnectingLine(map.mapLibreMap, [clickedPosition, revGeoResult.properties.originalPosition]);

            isMarkerVisible = true;
        }
    };

    const basemap = await BaseMapModule.get(map);
    basemap.events.on('click', onMapClick);

    // Starting with a Pin in the map
    await onMapClick(undefined, { lng: 4.8907, lat: 52.37311 } as LngLat);
})();
