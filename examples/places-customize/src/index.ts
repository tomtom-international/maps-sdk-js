import type { Place } from '@cet/maps-sdk-js/core';
import { TomTomConfig } from '@cet/maps-sdk-js/core';
import type { IconStyle, MapFont, PlaceIconConfig } from '@cet/maps-sdk-js/map';
import { PlacesModule, TomTomMap } from '@cet/maps-sdk-js/map';
import { search } from '@cet/maps-sdk-js/services';
import 'maplibre-gl/dist/maplibre-gl.css';
import tomtomLogo from '../resources/tomtomLogo.png';
import './style.css';

TomTomConfig.instance.put({
    // (Set your own API key when working in your own environment)
    apiKey: process.env.API_KEY_EXAMPLES,
    language: 'en-US',
});

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
        {
            category: 'ELECTRIC_VEHICLE_STATION',
            iconUrl: tomtomLogo,
        },
        {
            category: 'CAFE_PUB',
            iconUrl: 'https://dummyimage.com/30x20/4137ce/fff',
        },
    ],
};

const multiLineLabel: any = [
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
    const iconStyleSelector = document.getElementById('icon-style-selector') as HTMLSelectElement;
    colorSelectors.forEach((element) =>
        element.addEventListener('click', () => {
            colorSelectors.forEach((element) => element.classList.remove('active'));
            element.classList.add('active');
            places.applyTextConfig({ ...places.getConfig()?.textConfig, textColor: element.dataset.value });
        }),
    );

    fontSelectors.forEach((element) =>
        element.addEventListener('change', () => {
            places.applyTextConfig({
                ...places.getConfig()?.textConfig,
                textFont: [element.value as MapFont],
            });
        }),
    );

    contentSelectors.forEach((element) =>
        element.addEventListener('change', () => {
            element.value !== 'default' &&
                places.applyExtraFeatureProps({
                    phone: getPhoneFun,
                    staticProp: 'Static text',
                });
            places.applyTextConfig({
                ...places.getConfig()?.textConfig,
                textField: element.value !== 'default' ? multiLineLabel : ['get', 'title'],
            });
        }),
    );

    iconStyleSelector?.addEventListener('change', (e) => {
        const value = (e.target as HTMLSelectElement).value;
        if (value === 'custom') {
            places.applyIconConfig(customIconsConfig);
        } else {
            places.applyIconConfig({ iconStyle: value as IconStyle });
        }
    });
};

await updatePlaces();
map.mapLibreMap.on('moveend', updatePlaces);
listenToUIEvents();
