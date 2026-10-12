# Viewport Places Plugin

This plugin for the [TomTom Maps SDK for JavaScript](https://docs.tomtom.com/maps-sdk-js/introduction/overview) keeps places in sync with the current map viewport. Each search you add gets its own place module, which searches again whenever the map moves.

## Docs & examples

- Developer guide: https://docs.tomtom.com/maps-sdk-js/guides/plugins/viewport-places
- Example: https://docs.tomtom.com/maps-sdk-js/examples/viewport-places-plugin

## Quickstart

This plugin declares `@tomtom-org/maps-sdk` as a peer dependency, so install the SDK in your project too.

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

The plugin renders place modules bottom-up in the order you add them. The first module you add sits at the bottom, and later ones stack on top.

## License

See `LICENSE.txt`.
