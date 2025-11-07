import type { Place } from '@tomtom-org/maps-sdk/core';
import { TomTomConfig } from '@tomtom-org/maps-sdk/core';
import type { MapFont, PlaceIconConfig, PlacesTheme } from '@tomtom-org/maps-sdk/map';
import { PlacesModule, TomTomMap } from '@tomtom-org/maps-sdk/map';
import { search } from '@tomtom-org/maps-sdk/services';
import type { DataDrivenPropertyValueSpecification } from 'maplibre-gl';
import tomtomLogo from '../resources/tomtomLogo.png';
import './style.css';

// (Set your own API key when working in your own environment)
TomTomConfig.instance.put({ apiKey: process.env.API_KEY_EXAMPLES, language: 'en-US' });

const map = new TomTomMap({ container: 'maps-sdk-js-examples-map-container', center: [4.90435, 52.36876], zoom: 10 });
const places = await PlacesModule.get(map);

const fontSelectors: NodeListOf<HTMLInputElement> = document.querySelectorAll('.maps-sdk-js-examples-font-selector');
const contentSelectors: NodeListOf<HTMLInputElement> = document.querySelectorAll(
    '.maps-sdk-js-examples-content-selector',
);
const colorSelectors: NodeListOf<HTMLDivElement> = document.querySelectorAll('.maps-sdk-js-examples-color-selector');
colorSelectors.forEach((element) => {
    element.style.backgroundColor = element.dataset.value ?? '';
});

const customIconsConfig: PlaceIconConfig = {
    customIcons: [
        { id: 'ELECTRIC_VEHICLE_STATION', image: tomtomLogo, pixelRatio: 1 },
        { id: 'CAFE_PUB', image: 'https://dummyimage.com/30x20/4137ce/fff', pixelRatio: 1 },
    ],
};

const multiLineLabel: DataDrivenPropertyValueSpecification<string> = [
    'format',
    ['get', 'title'],
    { 'font-scale': 0.9 },
    '\n',
    {},
    ['get', 'phone'],
    { 'font-scale': 0.8, 'text-font': ['literal', ['Noto-Regular']], 'text-color': '#3125d1' },
    '\n',
    {},
    ['get', 'staticProp'],
    { 'font-scale': 0.7, 'text-font': ['literal', ['Noto-Bold']], 'text-color': '#ce258d' },
];

const getPhoneFun = (place: Place) => place.properties.poi?.phone;

const updatePlaces = async () => {
    await places.show(
        await search({
            query: '',
            poiCategories: ['ELECTRIC_VEHICLE_STATION', 'CAFE_PUB'],
            boundingBox: map.getBBox(),
            limit: 100,
        }),
    );
};

const listenToUIEvents = () => {
    const iconStyleSelector = document.getElementById('maps-sdk-js-examples-icon-style-selector') as HTMLSelectElement;
    colorSelectors.forEach((element) =>
        element.addEventListener('click', () => {
            colorSelectors.forEach((element) => element.classList.remove('active'));
            element.classList.add('active');
            places.applyTextConfig({ ...places.getConfig()?.text, color: element.dataset.value });
        }),
    );

    fontSelectors.forEach((element) =>
        element.addEventListener('change', () => {
            places.applyTextConfig({
                ...places.getConfig()?.text,
                font: [element.value as MapFont],
            });
        }),
    );

    for (const element of contentSelectors) {
        element.addEventListener('change', () => {
            element.value !== 'default' &&
                places.applyExtraFeatureProps({
                    phone: getPhoneFun,
                    staticProp: 'Static text',
                });
            places.applyTextConfig({
                ...places.getConfig()?.text,
                title: element.value === 'default' ? undefined : multiLineLabel,
            });
        });
    }

    iconStyleSelector?.addEventListener('change', (e) => {
        const value = (e.target as HTMLSelectElement).value;
        if (value === 'custom') {
            places.applyIconConfig(customIconsConfig);
        } else {
            places.applyIconConfig({ style: value as PlacesTheme });
        }
    });
};

await updatePlaces();
map.mapLibreMap.on('moveend', updatePlaces);
listenToUIEvents();
