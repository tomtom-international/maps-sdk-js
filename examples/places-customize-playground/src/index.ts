import type { Place } from '@tomtom-org/maps-sdk/core';
import { TomTomConfig } from '@tomtom-org/maps-sdk/core';
import type { PlaceIconConfig } from '@tomtom-org/maps-sdk/map';
import {
    calculatePaddedBBox,
    knobEntryOf,
    MAP_BOLD_FONT,
    MAP_REGULAR_FONT,
    mapFonts,
    PlacesModule,
    placesKnobCatalogue,
    placesMarkerTypes,
    TomTomMap,
} from '@tomtom-org/maps-sdk/map';
import { createLatestRequest, discoverPlaces } from '@tomtom-org/maps-sdk/services';
import type { DataDrivenPropertyValueSpecification } from 'maplibre-gl';
import tomtomLogo from './tomtomLogo.png';
import './style.css';
import { API_KEY } from './config';
import { initTogglePanel } from './togglePanel';

// (Set your own API key when working in your own environment)
TomTomConfig.instance.put({ apiKey: API_KEY, language: 'en-US' });

// The slider spans the range the SDK takes, read from the catalogue with its default.
const initIconOpacitySlider = (onInput: () => void): HTMLInputElement => {
    const slider = document.getElementById('ui-icon-opacity') as HTMLInputElement;
    const valueLabel = document.getElementById('ui-icon-opacity-value') as HTMLSpanElement;
    const { range, default: defaultOpacity } = knobEntryOf(placesKnobCatalogue, 'icon.opacity');
    slider.min = String(range?.min);
    slider.max = String(range?.max);
    slider.step = String(range?.step);
    slider.value = String(defaultOpacity);
    valueLabel.textContent = slider.value;
    slider.addEventListener('input', () => {
        valueLabel.textContent = slider.value;
        onInput();
    });
    return slider;
};

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
    const layerPositionSelectors: NodeListOf<HTMLInputElement> =
        document.querySelectorAll('.ui-layer-position-selector');
    const labelColorPicker = document.getElementById('ui-labelColorPicker') as HTMLInputElement;

    const cafeIcon =
        '<svg xmlns="http://www.w3.org/2000/svg" width="30" height="20"><rect width="30" height="20" fill="#4137ce"/></svg>';

    const buildCustomIconsConfig = (offsetX = 0, offsetY = 0): PlaceIconConfig => ({
        categoryIcons: [
            { id: 'CHARGING_LOCATION', image: tomtomLogo, pixelRatio: 1 },
            { id: 'CAFE', image: cafeIcon, pixelRatio: 1, offsetX, offsetY },
        ],
    });

    const multiLineLabel: DataDrivenPropertyValueSpecification<string> = [
        'format',
        ['get', 'title'],
        { 'font-scale': 0.9 },
        '\n',
        {},
        ['get', 'phone'], // comes as extra feature property, see extraFeatureProps below
        { 'font-scale': 0.8, 'text-font': ['literal', [MAP_REGULAR_FONT]], 'text-color': '#3125d1' },
        '\n',
        {},
        ['get', 'staticProp'], // comes as extra feature property, see extraFeatureProps below
        { 'font-scale': 0.7, 'text-font': ['literal', [MAP_BOLD_FONT]], 'text-color': '#ce258d' },
    ];

    // A new map move retires the previous move's search, so a slow answer cannot paint over a newer viewport
    const latestSearch = createLatestRequest();

    const updatePlaces = async () => {
        const boundingBox = calculatePaddedBBox({ map, surroundingElements: ['.ui-panel'] });
        if (!boundingBox) return;

        const search = await latestSearch.run((signal) =>
            discoverPlaces({
                filters: { poiCategories: ['CHARGING_LOCATION', 'CAFE_PUB'] },
                geoBias: { boundingBox },
                limit: 100,
                signal,
            }),
        );
        if (search.current) await places.show(search.value);
    };

    const listenToUIEvents = () => {
        const iconStyleSelector = document.getElementById('ui-icon-style-selector') as HTMLSelectElement;
        labelColorPicker.addEventListener('input', () => {
            places.updateConfig({ label: { ...places.getConfig()?.label, color: labelColorPicker.value } });
        });

        for (const element of fontSelectors) {
            element.addEventListener('change', () => {
                const font = mapFonts.find((candidate) => candidate === element.value);
                if (font) places.updateConfig({ label: { ...places.getConfig()?.label, font: [font] } });
            });
        }

        for (const element of contentSelectors) {
            element.addEventListener('change', () => {
                const multiLine = element.value !== 'default';
                // One update: each one re-applies the whole config and redraws every place.
                places.updateConfig({
                    extraFeatureProps: multiLine
                        ? {
                              phone: (place: Place) =>
                                  place.properties.poi?.phone ? `Phone: ${place.properties.poi.phone}` : '',
                              staticProp: 'Static text',
                          }
                        : undefined,
                    label: { ...places.getConfig()?.label, title: multiLine ? multiLineLabel : undefined },
                });
            });
        }

        iconStyleSelector?.addEventListener('change', () => {
            const markerType = placesMarkerTypes.find((type) => type === iconStyleSelector.value);
            if (markerType) places.updateConfig({ markerType });
        });

        for (const element of layerPositionSelectors) {
            element.addEventListener('change', () => {
                // Unset, the pins sit above the map's layers
                places.updateConfig({
                    beforeLayerConfig: element.value === 'under' ? { places: 'lowestLabel' } : undefined,
                });
            });
        }

        const customIconsToggle = document.getElementById('ui-custom-icons-toggle') as HTMLInputElement;
        const offsetXSlider = document.getElementById('ui-icon-offset-x') as HTMLInputElement;
        const offsetXValue = document.getElementById('ui-icon-offset-x-value') as HTMLSpanElement;
        const offsetYSlider = document.getElementById('ui-icon-offset-y') as HTMLInputElement;
        const offsetYValue = document.getElementById('ui-icon-offset-y-value') as HTMLSpanElement;

        const applyCustomIcons = () => {
            const config = customIconsToggle.checked
                ? buildCustomIconsConfig(Number(offsetXSlider.value), Number(offsetYSlider.value))
                : {};
            places.updateConfig({ icon: { ...config, opacity: Number(opacitySlider.value) } });
        };
        const opacitySlider = initIconOpacitySlider(applyCustomIcons);

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
