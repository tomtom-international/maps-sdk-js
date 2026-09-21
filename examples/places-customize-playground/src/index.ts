import type { BBox, Place } from '@tomtom-org/maps-sdk/core';
import { TomTomConfig } from '@tomtom-org/maps-sdk/core';
import type { MapFont, PlaceIconConfig, PlacesTheme } from '@tomtom-org/maps-sdk/map';
import { calculatePaddedBBox, PlacesModule, TomTomMap } from '@tomtom-org/maps-sdk/map';
import { search } from '@tomtom-org/maps-sdk/services';
import type { DataDrivenPropertyValueSpecification } from 'maplibre-gl';
import tomtomLogo from './tomtomLogo.png';
import './style.css';
import { API_KEY } from './config';
import { initTogglePanel } from './togglePanel';

// (Set your own API key when working in your own environment)
TomTomConfig.instance.put({ apiKey: API_KEY, language: 'en-US' });

(async () => {
    const map = new TomTomMap({
        mapLibre: {
            container: 'sdk-map',
            center: [4.90435, 52.36876],
            zoom: 10,
        },
    });
    const places = await PlacesModule.create(map);

    const fontSelectors: NodeListOf<HTMLInputElement> = document.querySelectorAll('.ui-font-selector');
    const contentSelectors: NodeListOf<HTMLInputElement> = document.querySelectorAll('.ui-content-selector');
    const labelColorPicker = document.getElementById('ui-labelColorPicker') as HTMLInputElement;

    const cafeIcon =
        '<svg xmlns="http://www.w3.org/2000/svg" width="30" height="20"><rect width="30" height="20" fill="#4137ce"/></svg>';

    const buildCustomIconsConfig = (offsetX = 0, offsetY = 0): PlaceIconConfig => ({
        categoryIcons: [
            { id: 'ELECTRIC_VEHICLE_STATION', image: tomtomLogo, pixelRatio: 1 },
            { id: 'CAFE', image: cafeIcon, pixelRatio: 1, offsetX, offsetY },
        ],
    });

    const multiLineLabel: DataDrivenPropertyValueSpecification<string> = [
        'format',
        ['get', 'title'],
        { 'font-scale': 0.9 },
        '\n',
        {},
        ['get', 'phone'], // comes as extra feature property, see applyExtraFeatureProps call below
        { 'font-scale': 0.8, 'text-font': ['literal', ['Noto-Regular']], 'text-color': '#3125d1' },
        '\n',
        {},
        ['get', 'staticProp'], // comes as extra feature property, see applyExtraFeatureProps call below
        { 'font-scale': 0.7, 'text-font': ['literal', ['Noto-Bold']], 'text-color': '#ce258d' },
    ];

    const updatePlaces = async () => {
        await places.show(
            await search({
                poiCategories: ['ELECTRIC_VEHICLE_STATION', 'CAFE_PUB'],
                boundingBox: calculatePaddedBBox({ map, surroundingElements: ['.ui-panel'] }) as BBox,
                limit: 100,
            }),
        );
    };

    const listenToUIEvents = () => {
        const iconStyleSelector = document.getElementById('ui-icon-style-selector') as HTMLSelectElement;
        labelColorPicker.addEventListener('input', () => {
            places.applyTextConfig({ ...places.getConfig()?.text, color: labelColorPicker.value });
        });

        for (const element of fontSelectors) {
            element.addEventListener('change', () => {
                places.applyTextConfig({
                    ...places.getConfig()?.text,
                    font: [element.value as MapFont],
                });
            });
        }

        for (const element of contentSelectors) {
            element.addEventListener('change', () => {
                element.value !== 'default' &&
                    places.applyExtraFeatureProps({
                        phone: (place: Place) => `Phone: ${place.properties.poi?.phone}`,
                        staticProp: 'Static text',
                    });
                places.applyTextConfig({
                    ...places.getConfig()?.text,
                    title: element.value === 'default' ? undefined : multiLineLabel,
                });
            });
        }

        iconStyleSelector?.addEventListener('change', (e) => {
            places.applyTheme((e.target as HTMLSelectElement).value as PlacesTheme);
        });

        const customIconsToggle = document.getElementById('ui-custom-icons-toggle') as HTMLInputElement;
        const offsetXSlider = document.getElementById('ui-icon-offset-x') as HTMLInputElement;
        const offsetXValue = document.getElementById('ui-icon-offset-x-value') as HTMLSpanElement;
        const offsetYSlider = document.getElementById('ui-icon-offset-y') as HTMLInputElement;
        const offsetYValue = document.getElementById('ui-icon-offset-y-value') as HTMLSpanElement;

        const applyCustomIcons = () => {
            const config = customIconsToggle.checked
                ? buildCustomIconsConfig(Number(offsetXSlider.value), Number(offsetYSlider.value))
                : {};
            places.applyIconConfig(config);
        };

        customIconsToggle?.addEventListener('change', applyCustomIcons);
        offsetXSlider?.addEventListener('input', () => {
            offsetXValue.textContent = `${offsetXSlider.value}px`;
            applyCustomIcons();
        });
        offsetYSlider?.addEventListener('input', () => {
            offsetYValue.textContent = `${offsetYSlider.value}px`;
            applyCustomIcons();
        });
    };

    initTogglePanel();

    await updatePlaces();
    map.mapLibreMap.on('moveend', updatePlaces);
    listenToUIEvents();
})();
