import { bboxFromGeoJSON, TomTomConfig } from '@tomtom-org/maps-sdk/core';
import { type CustomImage, type MapStylePOICategory, PlacesModule, TomTomMap } from '@tomtom-org/maps-sdk/map';
import { discoverPlaces, type GeoBias, type SearchFilters } from '@tomtom-org/maps-sdk/services';
import './style.css';
import { API_KEY } from './config';

// (Set your own API key when working in your own environment)
TomTomConfig.instance.put({ apiKey: API_KEY, language: 'en-GB' });

// Maastricht sits on the border between the Netherlands and Belgium
const aroundMaastricht: GeoBias = { position: [5.6909, 50.8514], radiusMeters: 15000 };

// Places modules stack in creation order, so the last filter set draws on top
const filterSets: { label: string; color: string; filters: SearchFilters }[] = [
    { label: 'In Belgium', color: '#7B61FF', filters: { countries: ['BE'] } },
    { label: 'Selling LPG', color: '#12A150', filters: { fuelTypes: ['LPG'] } },
    { label: 'Shell', color: '#F06A00', filters: { poiBrands: ['Shell'] } },
];

// `color` fills only the pin of places without a category, so fuel stations get a pin of their own.
// 52 × 68 image pixels at the default pixel ratio of 2, lifted half its height to stand on its tip.
const fuelStationPin = (color: string): CustomImage<MapStylePOICategory> => ({
    id: 'FUEL_STATION',
    image:
        '<svg xmlns="http://www.w3.org/2000/svg" width="52" height="68" viewBox="0 0 52 68">' +
        `<path d="M26 66C20 52 3 44 3 26a23 23 0 0 1 46 0c0 18-17 26-23 40z" fill="${color}" stroke="#fff" stroke-width="3"/>` +
        '<circle cx="26" cy="26" r="9" fill="#fff"/></svg>',
    offsetY: -17,
});

(async () => {
    const results = await Promise.all(
        filterSets.map(({ filters }) =>
            discoverPlaces({
                filters: { poiCategories: ['FUEL_STATION'], ...filters },
                geoBias: aroundMaastricht,
                limit: 100,
            }),
        ),
    );

    const map = new TomTomMap({
        mapLibre: {
            container: 'sdk-map',
            bounds: bboxFromGeoJSON(results),
            fitBoundsOptions: { padding: 50 },
        },
    });

    const legend = document.querySelector('#legend') as HTMLUListElement;
    for (const [index, { label, color }] of filterSets.entries()) {
        const placesModule = await PlacesModule.create(map, {
            color,
            icon: { categoryIcons: [fuelStationPin(color)] },
        });
        await placesModule.show(results[index]);

        const swatch = document.createElement('span');
        swatch.className = 'ui-legend-swatch';
        swatch.style.background = color;
        const item = document.createElement('li');
        const count = Object.assign(document.createElement('span'), {
            className: 'ui-legend-count',
            textContent: `(${results[index].features.length})`,
        });
        item.append(swatch, `${label} `, count);
        legend.prepend(item);
    }
})();
