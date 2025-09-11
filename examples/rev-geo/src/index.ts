import '../styles.css';
import { AddressProperties, TomTomConfig } from '@cet/maps-sdk-js/core';
import { BaseMapModule, TomTomMap } from '@cet/maps-sdk-js/map';
import { reverseGeocode } from '@cet/maps-sdk-js/services';
import type { Point } from 'geojson';
import { LngLat, Map, Marker, Popup } from 'maplibre-gl';

// (Set your own API key when working in your own environment)
TomTomConfig.instance.put({ apiKey: process.env.API_KEY_EXAMPLES });

let tomtomMap: TomTomMap;
let mapLibreMap: Map;
let isMarkerVisible = false;

// Creating the pin and the dot using CSS
const pinIcon = document.createElement('div');
pinIcon.classList.add('pin');
const dotIcon = document.createElement('div');
dotIcon.classList.add('dot');

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
    new Popup({ anchor: 'bottom', className: 'popup', closeButton: false })
        .setHTML(
            `
        <div id="popup-content" class="popup-content">
            ${address.freeformAddress ? `${address.freeformAddress} <hr />` : ''}
               <span id="popup-lnglat" class="popup-lnglat">
                ${geometry.coordinates[0].toFixed(5)}, ${geometry.coordinates[1].toFixed(5)}
               </span>
        </div>
       `,
        )
        .setLngLat(lngLat)
        .addTo(mapLibreMap);
};

const onMapClick = async (_: any, lnglat: LngLat) => {
    if (isMarkerVisible) {
        removeMarkers();
    } else {
        // Initializing dot marker with the exactly coordinates where it was clicked
        dotClickedMaker.setLngLat(lnglat).addTo(mapLibreMap);

        const { properties, geometry } = await reverseGeocode({ position: [lnglat.lng, lnglat.lat] });
        const { originalPosition, address } = properties;
        const [lng, lat] = originalPosition;

        revGeoMarker.setLngLat({ lat, lng }).addTo(mapLibreMap);
        isMarkerVisible = true;
        showAddress({ geometry, address, lngLat: lnglat });
    }
};

(async () => {
    tomtomMap = new TomTomMap({ container: 'map', center: [4.89147, 52.37362], zoom: 17 }, { style: 'monoLight' });
    mapLibreMap = tomtomMap.mapLibreMap;

    // Initializing BaseMap module
    const basemap = await BaseMapModule.get(tomtomMap);
    basemap.events.on('click', onMapClick);

    // Starting with a Pin in the map
    await onMapClick(undefined, { lng: 4.8907, lat: 52.37311 } as LngLat);

    (window as any).map = tomtomMap; // This has been done for automation test support
})();
