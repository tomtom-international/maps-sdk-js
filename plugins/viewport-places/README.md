# Viewport Places Plugin

Plugin for the [TomTom Maps SDK for JavaScript](https://docs.tomtom.com/maps-sdk-js/introduction/overview) that keeps places in sync with the current map viewport: each search you add gets its own place module, which searches again whenever the map moves.

## Docs & examples

- Developer guide: https://docs.tomtom.com/maps-sdk-js/guides/plugins/viewport-places
- Example: https://docs.tomtom.com/maps-sdk-js/examples/viewport-places-plugin

## Quickstart

Note: this plugin declares `@tomtom-org/maps-sdk` as a peer dependency — ensure the SDK is installed in your project.

```bash
npm install @tomtom-org/maps-sdk maplibre-gl @tomtom-org/maps-sdk-plugin-viewport-places
```

1. Follow the SDK [Project setup](https://docs.tomtom.com/maps-sdk-js/introduction/project-setup) or the Map [quickstart](https://docs.tomtom.com/maps-sdk-js/guides/map/quickstart) to create and initialize a `TomTomMap`.

2. Import and use the plugin (plugin-specific steps only):

```ts
import { ViewportPlaces } from '@tomtom-org/maps-sdk-plugin-viewport-places';

// assume `map` is your initialized TomTomMap instance
const viewportPlaces = new ViewportPlaces(map);

// a text search
await viewportPlaces.add({
  id: 'restaurants',
  searchOptions: { query: 'restaurant', limit: 40 },
  minZoom: 12,
});

// a POI category search
await viewportPlaces.addPOICategories({
  id: 'parking',
  categories: ['PARKING_GARAGE', 'CHARGING_LOCATION'],
});

// change or drop a place module by its id
await viewportPlaces.update({ id: 'restaurants', searchOptions: { query: 'pizza' } });
viewportPlaces.remove('parking');
```

Place modules are rendered bottom-up in the order they are added: the first added module appears at the bottom and later modules are stacked on top.

## License

See `LICENSE.txt`.
