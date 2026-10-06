# Flyover Plugin

A camera that flies a route on a [TomTom Maps SDK for JavaScript](https://docs.tomtom.com/maps-sdk-js/introduction/overview)
map: it follows the line, aims at the junctions ahead, frames them, keeps clear of the terrain it
crosses, and parks the followed position — marked with an arrow — where you want it on screen.

## Docs & examples

- Developer guide: https://docs.tomtom.com/maps-sdk-js/guides/plugins/flyover
- Example: https://docs.tomtom.com/maps-sdk-js/examples/route-flyover-playground

## Quickstart

Note: this plugin declares `@tomtom-org/maps-sdk` and `maplibre-gl` as peer dependencies and bundles neither — ensure both are installed in your project.

```bash
npm install @tomtom-org/maps-sdk maplibre-gl @tomtom-org/maps-sdk-plugin-flyover
```

```javascript
import { calculateRoute } from '@tomtom-org/maps-sdk/services';
import { RouteFlyover } from '@tomtom-org/maps-sdk-plugin-flyover';

// `guidance` unlocks the modes that read the junctions ahead; without it they fall back.
const routes = await calculateRoute({ locations, guidance: { type: 'coded' } });

const flyover = new RouteFlyover(map, {
    route: routes.features[0],
    camera: { speedKMH: 300, pitch: 76 },
});

flyover.start();
```

## Features

The route is the only geometry it needs — no camera keyframes to author, and no animation to
re-time when the route changes. The flight loops: it wraps at the destination and never lands.

- **Aim** — at the next guidance instruction, a fixed distance down the road, or a number of the
  route's own vertices.
- **Framing** — the zoom that fits the next junctions, one tied to the speed, or a fixed one.
- **Anchor** — where the followed position sits in the view; absent one, it slides down with the pitch.
- **Marker** — an arrow on the followed position, facing the road; restyle it, swap in your own
  image, or hide it.
- **Terrain clearance** — the camera pulls back where a ridge would come between it and the road,
  so a mountain route stays a flight.
- **Smooth by default** — every value the camera changes moves on a critically damped spring, the
  same at any frame rate.

## License

See [LICENSE.txt](./LICENSE.txt).
