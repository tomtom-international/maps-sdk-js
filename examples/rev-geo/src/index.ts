import { AddressProperties, TomTomConfig } from '@cet/maps-sdk-js/core';
import { BaseMapModule, TomTomMap } from '@cet/maps-sdk-js/map';
import { reverseGeocode } from '@cet/maps-sdk-js/services';
import type { Point } from 'geojson';
import { LngLat, Marker, Popup } from 'maplibre-gl';
import 'maplibre-gl/dist/maplibre-gl.css';
import './style.css';

// (Set your own API key when working in your own environment)
TomTomConfig.instance.put({ apiKey: process.env.API_KEY_EXAMPLES });


const map = new TomTomMap(
    { container: 'maps-sdk-js-examples-map-container', center: [4.89147, 52.37362], zoom: 17 },
    { style: 'monoLight' },
);
let isMarkerVisible = false;

// Creating the pin and the dot using CSS
const pinIcon = document.createElement('div');
pinIcon.classList.add('maps-sdk-js-examples-pin');
const dotIcon = document.createElement('div');
dotIcon.classList.add('maps-sdk-js-examples-dot');

const revGeoMarker = new Marker({ element: pinIcon, offset: [0, -25] });
const dotClickedMaker = new Marker({ element: dotIcon });

const removeMarkers = () => {
    revGeoMarker.remove();
    dotClickedMaker.remove();
    isMarkerVisible = false;
};

const showAddress = ({
    geometry,
    address,
    lngLat,
}: {
    geometry: Point;
    address: AddressProperties;
    lngLat: LngLat;
}) => {
    new Popup({ anchor: 'bottom', className: 'maps-sdk-js-examples-popup', closeButton: false })
        .setHTML(
            `
        <div class="maps-sdk-js-examples-popup-content">
            ${address.freeformAddress ? `${address.freeformAddress} <hr class="maps-sdk-js-examples-hr" />` : ''}
               <span class="maps-sdk-js-examples-popup-lnglat">
                ${geometry.coordinates[0].toFixed(5)}, ${geometry.coordinates[1].toFixed(5)}
               </span>
        </div>
       `,
        )
        .setLngLat(lngLat)
        .addTo(map.mapLibreMap);
};

const onMapClick = async (_: any, lnglat: LngLat) => {
    if (isMarkerVisible) {
        removeMarkers();
    } else {
        // Initializing dot marker with the exactly coordinates where it was clicked
        dotClickedMaker.setLngLat(lnglat).addTo(map.mapLibreMap);

        const { properties, geometry } = await reverseGeocode({ position: [lnglat.lng, lnglat.lat] });
        const { originalPosition, address } = properties;
        const [lng, lat] = originalPosition;

        revGeoMarker.setLngLat({ lat, lng }).addTo(map.mapLibreMap);
        isMarkerVisible = true;
        showAddress({ geometry, address, lngLat: lnglat });
    }
};


// Initializing BaseMap module
const basemap = await BaseMapModule.get(map);
basemap.events.on('click', onMapClick);

// Starting with a Pin in the map
await onMapClick(undefined, { lng: 4.8907, lat: 52.37311 } as LngLat);

(window as any).map = map; // This has been done for automation test support
