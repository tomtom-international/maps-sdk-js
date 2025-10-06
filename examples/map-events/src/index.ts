import { Place, TomTomConfig } from '@cet/maps-sdk-js/core';
import { BaseMapModule, PlacesModule, TomTomMap, TrafficIncidentsModule } from '@cet/maps-sdk-js/map';
import { reverseGeocode, search } from '@cet/maps-sdk-js/services';
import { LngLat, MapGeoJSONFeature, Marker, NavigationControl, Popup } from 'maplibre-gl';
import 'maplibre-gl/dist/maplibre-gl.css';
import './style.css';

// (Set your own API key when working in your own environment)
TomTomConfig.instance.put({ apiKey: process.env.API_KEY_EXAMPLES });

let map: TomTomMap;
const popUp = new Popup({
    closeButton: true,
    closeOnClick: true,
    closeOnMove: true,
    offset: 15,
    className: 'maps-sdk-js-examples-popup',
});
let isMarkerVisible = false;
const revGeocodingMarker = new Marker({ color: '#df1b12' });

const showTrafficPopup = (topFeature: MapGeoJSONFeature, lngLat: LngLat) => {
    const { properties } = topFeature;

    const incidentSeverity: Record<number, string> = {
        3: 'major',
        2: 'moderate',
        1: 'minor',
    };

    popUp
        .setOffset(5)
        .setHTML(
            `
        <div id="traffic-incident-popup">
        <h3>Traffic incident</h3>
        <b id="traffic-incident-road-type">Road type</b> ${topFeature.properties.road_category}<br />
        <b id="traffic-incident-magnitude">Magnitude</b> ${incidentSeverity[properties.magnitude]} <br />
        <b id="traffic-incident-delay">Delay</b> ${Math.floor(properties.delay / 60)} m ${
            properties.delay % 60
        } s</b> <br />
        </div>
        `,
        )
        .setLngLat(lngLat)
        .addTo(map.mapLibreMap);
};

const initTrafficIncidents = async () => {
    (await TrafficIncidentsModule.get(map)).events.on('long-hover', showTrafficPopup);
};

const showPlacesPopUp = (topFeature: Place, lngLat: LngLat) => {
    const { address, poi } = topFeature.properties;

    if (isMarkerVisible) {
        revGeocodingMarker.remove();
    }

    new Popup({
        closeButton: true,
        closeOnClick: true,
        closeOnMove: true,
        offset: 15,
        className: 'maps-sdk-js-examples-popup',
    })
        .setHTML(
            `
            <div id="place-popup">
            <h3 id="place-name">${poi?.name}</h3>
            <b id="place-address"> Address: </b> ${address.freeformAddress}
            <br />
            ${poi?.phone ? `<b> Phone: </b> ${poi?.phone}` : ''}
            <div id="maps-sdk-js-examples-popup-tags">
            ${poi?.categories?.map((category) => `<span class="maps-sdk-js-examples-popup-tags-item">${category}</span>`)}
            </div>
            </div> 
            `,
        )
        .setLngLat(lngLat)
        .addTo(map.mapLibreMap)
        .once('close', () => (isMarkerVisible = true));
};

const initPlacesModule = async () => {
    const placesModule = await PlacesModule.init(map);

    const places = await search({
        query: 'pharmacy',
        limit: 35,
        boundingBox: map.getBBox(),
    });

    placesModule.show(places);
    placesModule.events.on('click', showPlacesPopUp);
};

const showBasemapPopup = async (_: any, lnglat: LngLat) => {
    const { properties } = await reverseGeocode({ position: [lnglat.lng, lnglat.lat] });
    revGeocodingMarker.setLngLat(lnglat).addTo(map.mapLibreMap);

    if (!isMarkerVisible) {
        new Popup({
            closeButton: true,
            closeOnClick: true,
            closeOnMove: true,
            offset: 6,
            className: 'maps-sdk-js-examples-popup-basemap',
        })
            .setHTML(
                `
                <div id="maps-sdk-js-examples-popup-basemap">
                ${
                    properties.address.freeformAddress
                        ? ` <h4 id="maps-sdk-js-examples-popup-basemap-address">${properties.address.freeformAddress}</h4> <hr class="maps-sdk-js-examples-hr" />`
                        : ''
                }
                    <div id="maps-sdk-js-examples-popup-lnglat">
                        <span> ${lnglat.lng.toFixed(5)}, ${lnglat.lat.toFixed(5)}</span>
                    </div>
                </div> 
                `,
            )
            .setLngLat(lnglat)
            .addTo(map.mapLibreMap);
        isMarkerVisible = true;
    } else {
        revGeocodingMarker.remove();
        isMarkerVisible = false;
    }
};

const initBaseMapModule = async () => {
    const baseModule = await BaseMapModule.get(map);
    // Listening hover events on Basemap module to remove traffic popups.
    baseModule.events.on('hover', () => popUp.isOpen() && popUp.remove());
    baseModule.events.on('click', showBasemapPopup);
};

map = new TomTomMap(
    { container: 'maps-sdk-js-examples-map-container', center: [-0.12634, 51.50276], zoom: 14 },
    { language: 'en-GB', style: { type: 'standard', include: ['trafficIncidents'] } },
);

map.mapLibreMap.addControl(new NavigationControl());
map.mapLibreMap.on('dragstart', () => {
    revGeocodingMarker.remove();
    isMarkerVisible = false;
});

await initBaseMapModule();
await initPlacesModule();
await initTrafficIncidents();
(window as any).map = map; // This has been done for automation test support
