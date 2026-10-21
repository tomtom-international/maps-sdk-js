# Route Dragging Plugin

This plugin lets people edit a route on a [TomTom Maps SDK for JavaScript](https://docs.tomtom.com/maps-sdk-js/introduction/overview)
map by dragging it. Grab a stop's pin to move it, or pull the route line to add a stop. The route
re-plans while the pointer moves, so the road follows the hand.

> **Public preview.** This plugin is in [Public Preview](https://docs.tomtom.com/legal/public-preview) until its 1.0.0 release.

## Docs & examples

- Developer guide: https://docs.tomtom.com/maps-sdk-js/guides/plugins/route-dragging
- Example: https://docs.tomtom.com/maps-sdk-js/examples/route-dragging-plugin

## Quickstart

This plugin declares `@tomtom-org/maps-sdk` and `lodash-es` as peer dependencies and bundles neither. `lodash-es` is one of the SDK's own peers, so it installs with the SDK.

```bash
npm install @tomtom-org/maps-sdk maplibre-gl @tomtom-org/maps-sdk-plugin-route-dragging
```

```javascript
import { RoutingModule } from '@tomtom-org/maps-sdk/map';
import { RouteDragging } from '@tomtom-org/maps-sdk-plugin-route-dragging';

const routing = await RoutingModule.create(map);
const dragging = new RouteDragging(routing);

await dragging.setWaypoints([
    [4.9041, 52.3676], // Amsterdam
    [5.1214, 52.0907], // Utrecht
]);
```

## Features

- **Move a stop** by its pin. The pin keeps the spot you grabbed it by, so it doesn't jump under the pointer.
- **Add a stop** by pulling a route line. It goes between the two stops its detour fits best.
- **Live re-planning**, twice a second by default and once more on the drop.
- **Answers in order.** The requests overlap rather than cancel each other, so a slow route still
  shows mid-drag, and an older answer never replaces a newer one.
- **Your own planner.** Pass `plan` to route with your own options, such as a truck profile or alternatives.
- **Your own state.** With `showOnMap: false`, it shows nothing itself: it reports each change and
  each route, and your app shows them, as a React or Vue store would want.

## License

See [LICENSE.txt](./LICENSE.txt).

## Security

To report a security vulnerability, follow [SECURITY.md](https://github.com/tomtom-international/maps-sdk-js/blob/main/SECURITY.md), which keeps it private.
