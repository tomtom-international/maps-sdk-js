import type { Place } from '@cet/maps-sdk-js/core';
import { TomTomConfig } from '@cet/maps-sdk-js/core';
import type { IconStyle, MapFont, PlaceIconConfig, PlaceTextConfig } from '@cet/maps-sdk-js/map';
import { PlacesModule, TomTomMap } from '@cet/maps-sdk-js/map';
import { search } from '@cet/maps-sdk-js/services';
import tomtomLogo from '../resources/tomtomLogo.png';

TomTomConfig.instance.put({
    // (Set your own API key when working in your own environment)
    apiKey: process.env.API_KEY_EXAMPLES,
    language: 'en-US',
});

let map: TomTomMap;
let places: PlacesModule;
let colorSelectors: NodeListOf<HTMLDivElement>;
let fontSelectors: NodeListOf<HTMLInputElement>;
let contentSelectors: NodeListOf<HTMLInputElement>;
const iconConfig: PlaceIconConfig = { iconStyle: 'pin' };
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
let textConfig: PlaceTextConfig = {};
const getPhoneFun = (place: Place) => place.properties.poi?.phone;

const updatePlaces = async () => {
    places.show(
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
            textConfig = { ...textConfig, textColor: element.dataset.value };
            places.applyTextConfig(textConfig);
        }),
    );

    fontSelectors.forEach((element) =>
        element.addEventListener('change', () => {
            textConfig = {
                ...textConfig,
                textFont: [element.value as MapFont],
            };
            places.applyTextConfig(textConfig);
        }),
    );
    contentSelectors.forEach((element) =>
        element.addEventListener('change', () => {
            element.value !== 'default' &&
                places.setExtraFeatureProps({
                    phone: getPhoneFun,
                    staticProp: 'Static text',
                });
            textConfig = {
                ...textConfig,
                textField: element.value !== 'default' ? multiLineLabel : ['get', 'title'],
            };
            places.applyTextConfig(textConfig);
        }),
    );
    iconStyleSelector?.addEventListener('change', (e) => {
        const value = (e.target as HTMLSelectElement).value;
        if (value !== 'custom') {
            iconConfig.iconStyle = value as IconStyle;
            places.applyIconConfig(iconConfig);
        } else {
            places.applyIconConfig(customIconsConfig);
        }
    });
};

const initExample = async () => {
    map = new TomTomMap({ container: 'map', center: [4.90435, 52.36876], zoom: 10 });
    places = await PlacesModule.init(map);
    await updatePlaces();
    map.mapLibreMap.on('moveend', updatePlaces);
    colorSelectors = document.querySelectorAll('.color-selector');
    fontSelectors = document.querySelectorAll('.font-selector');
    contentSelectors = document.querySelectorAll('.content-selector');
    colorSelectors.forEach((element) => {
        element.style.backgroundColor = element.dataset.value ?? '';
    });
    listenToUIEvents();
    (window as any).map = map; // This has been done for automation test support
};

window.addEventListener('load', initExample);
