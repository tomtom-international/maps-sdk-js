# Services Configuration Reference

## Imports

```ts
import { TomTomConfig } from '@tomtom-org/maps-sdk/core';
```

---

## Global configuration

Set once at startup — all service calls and maps inherit these settings:

```ts
TomTomConfig.instance.put({
    apiKey: 'YOUR_API_KEY',
    language: 'en-GB',
});

// Update at runtime (shallow merge)
TomTomConfig.instance.put({ language: 'fr-FR' });

// Read current config
const { language } = TomTomConfig.instance.get();

// Reset to defaults (clears apiKey)
TomTomConfig.instance.reset();
```

`commonBaseURL` (default `https://api.tomtom.com`) is only for routing every request through your own proxy; leave `apiKey` unset as well for proxy-credentials mode, where the proxy injects the key. See [Proxying your API calls](https://docs.tomtom.com/maps-sdk-js/guides/security/proxying-api-calls).

---

## Per-call overrides

Any service call accepts these overrides:

```ts
// Override API key for a specific call
const results = await discoverPlaces({
    query: 'restaurants',
    apiKey: process.env.TOMTOM_PREMIUM_API_KEY,
});

// Disable request validation (saves CPU when inputs are trusted)
await discoverPlaces({
    query: 'coffee',
    validateRequest: false,
});

// Cancel a call; to drop a superseded one, use `createLatestRequest` (below)
const controller = new AbortController();
await discoverPlaces({
    query: 'coffee',
    signal: controller.signal,
});

// There is no `timeout` option — compose a deadline onto the signal instead
await calculateRoute({
    locations: [[4.9, 52.4], [2.3, 48.8]],
    signal: AbortSignal.any([controller.signal, AbortSignal.timeout(15000)]),
});
```

Aborting cancels the in-flight HTTP request, including while the SDK waits to retry a `429`.
An already-aborted signal rejects before any request is sent. A deadline rejects with
`SDKAbortError` too; `error.cause` tells it apart from a manual abort.

### Keeping only the latest request

When a new user action supersedes the previous call (a click lookup, search-as-you-type, refetch on
map move), use `createLatestRequest` instead of swapping an `AbortController` by hand:

```ts
import { createLatestRequest, reverseGeocode } from '@tomtom-org/maps-sdk/services';

const latestLookup = createLatestRequest();

map.mapLibreMap.on('click', async (event) => {
    const lookup = await latestLookup.run((signal) =>
        reverseGeocode({ position: event.lngLat.toArray(), signal }),
    );
    if (!lookup.current) return; // retired by a newer run or by cancel()
    showAddress(lookup.value);
});
clearButton.addEventListener('click', latestLookup.cancel);
```

- `run(request)` aborts the previous request, then calls `request(signal)` synchronously. Pass that
  `signal` to every service call inside it; several chained calls may share it.
- Resolves `{ current: true, value }` or `{ current: false }`. A retired request never rejects, and
  an answer landing after `cancel()` is dropped, so no `SDKAbortError` handling or post-`await`
  `signal.aborted` check is needed.
- Errors of the current request are rethrown, including a deadline you composed onto the signal.
- `isRunning()` reports whether a request is in flight. Use one `createLatestRequest()` per thing
  that can be superseded independently.
- It cancels, it does not debounce: every `run` still sends its request. To send fewer while the
  user types or drags, debounce the input yourself and call `run` from the debounced handler.
- `calculateReachableRanges` takes its signal as a second argument — see `routing.md`.

---

## Lifecycle hooks

Observe outgoing requests and raw responses without modifying them — useful for debugging, logging, analytics:

```ts
await discoverPlaces({
    query: 'Eiffel Tower',
    onAPIRequest: (apiRequest) => {
        console.debug('→ Request:', apiRequest);
    },
    onAPIResponse: (apiRequest, apiResponse) => {
        console.debug('← Response:', apiResponse);
    },
});
```

`apiRequest` is `{ url, headers, data? }` (a bare `URL` for EV charging availability). Routing, places and traffic incident details send the API key as `headers['TomTom-Api-Key']`, not in the URL — redact it before logging. To route calls through a backend, set the global `commonBaseURL` rather than sending requests yourself; endpoint paths and API versions are not configurable.

---

## Error handling

Every rejection is an `SDKError`. HTTP failures are `SDKServiceError` (adds `.status`), and a
cancelled call is `SDKAbortError` (`name === 'AbortError'`, abort reason on `.cause`).

`SDKAbortError` carries no `.status`, so match it **before** any status check or a cancellation
reads as an unknown failure. Under `createLatestRequest` a superseded call resolves
`{ current: false }` instead, so the abort that still reaches a `catch` is your own deadline:

```ts
import { SDKAbortError, discoverPlaces } from '@tomtom-org/maps-sdk/services';

try {
    const results = await discoverPlaces({
        query: 'coffee',
        geoBias: { position: [4.9, 52.4] },
        signal: AbortSignal.timeout(5000),
    });
} catch (error) {
    if (error instanceof SDKAbortError) return console.error('Search timed out');

    switch (error.status) {
        case 400: console.error('Bad request — check parameters'); break;
        case 401: console.error('Invalid API key'); break;
        case 403: console.error('API key lacks required permissions'); break;
        case 429: console.error('Rate limit — implement exponential backoff'); break;
        default:  console.error('Service error:', error.message);
    }
}
```

**Tip:** Both `geocodeOne()` and `discoverOnePlace()` throw if no result — use `geocode()` / `discoverPlaces()` or wrap in try/catch when the query might not be found. Both take a query string or the params object minus `limit` — `discoverOnePlace({ query, geoBias, signal })`.
