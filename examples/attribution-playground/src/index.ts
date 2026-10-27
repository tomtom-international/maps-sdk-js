import { TomTomConfig } from '@tomtom-org/maps-sdk/core';
import { TomTomMap } from '@tomtom-org/maps-sdk/map';
import './style.css';
import { attributionCode } from './attributionCode';
import { API_KEY } from './config';
import { initPanel, type PanelAttribution } from './panel';

// (Set your own API key when working in your own environment)
TomTomConfig.instance.put({ apiKey: API_KEY, language: 'en-GB' });

const codeElement = document.querySelector('#ui-code') as HTMLElement;
let map: TomTomMap | undefined;

// `attribution` is a map-init option, so a new one means a new map, opened where the last one was.
const createMap = (attribution: PanelAttribution, sheetHeight: number): void => {
    const camera = map && {
        center: map.mapLibreMap.getCenter(),
        zoom: map.mapLibreMap.getZoom(),
        bearing: map.mapLibreMap.getBearing(),
        pitch: map.mapLibreMap.getPitch(),
    };
    const style = map?.getStyleInput();
    map?.mapLibreMap.remove();

    map = new TomTomMap({
        mapLibre: { container: 'sdk-map', center: [4.8952, 52.3702], zoom: 13, ...camera },
        style,
        attribution,
    });
    codeElement.textContent = attributionCode(attribution, sheetHeight);
};

initPanel(createMap, (style) => map?.setStyle(style));
