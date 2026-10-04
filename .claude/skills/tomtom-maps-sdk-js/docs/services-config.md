# Services Configuration Reference

## Imports

```ts
import { TomTomConfig } from '@tomtom-org/maps-sdk/core';
import { createLatestRequest, SDKAbortError, SDKError, SDKServiceError } from '@tomtom-org/maps-sdk/services';
import { type SDKErrorCode, sdkErrorCodes } from '@tomtom-org/maps-sdk/core';
```

---

## Global configuration

Set once at startup — all service calls and maps inherit these settings:

```ts
TomTomConfig.instance.put({
    apiKey: 'YOUR_API_KEY',
    language: 'en-GB',
});

// Update at runtime — shallow merge: a nested object (displayUnits) is replaced whole; retry is the exception
TomTomConfig.instance.put({ language: 'fr-FR' });

// Read current config
const { language } = TomTomConfig.instance.get();

// Reset to defaults (apiKey becomes '')
TomTomConfig.instance.reset();
```

| Key | Default | Notes |
|---|---|---|
| `apiKey` | `''` | |
| `commonBaseURL` | `'https://api.tomtom.com'` | Only for routing every request (services, style, tiles, sprites, glyphs) through your own proxy. Leave `apiKey` unset too for proxy-credentials mode: no key sent, `credentials: 'include'`. Must be `https:` or relative; `http:` only for loopback (`localhost`, `127.x`, `[::1]`), else `INSECURE_BASE_URL`, even with `validateRequest: false`. See [Proxying your API calls](https://docs.tomtom.com/maps-sdk-js/guides/security/proxying-api-calls.md). |
| `language` | unset → APIs answer in `NGT` (local language) | `Language` type; `languages` lists them |
| `geopoliticalView` | unset → caller's country default | [below](#geopolitical-view) |
| `sendUserAgentHeader` | `true` | `false` stops every service and map request from carrying the `tomtom-user-agent` header (`MapsSDKJS/<version>`). A map reads it at construction |
| `displayUnits` | metric, `km`/`m`, `hr`/`min` | `{ distance: { type: 'metric' \| 'imperial_us' \| 'imperial_uk', …labels }, time: { hours, minutes } }` — used by `formatDistance` / `formatDuration` and the routing module's labels; see `core-utilities.md` |
| `retry` | `{ initialWaitMs: 0.447, backoffFactor: 1.618, timeoutMs: 40000 }` | Retries `429` with exponential backoff, honouring `Retry-After` |

- `retry` is read from the global config only, never per call. A field left out of a `put` takes its default (not an earlier `put`'s value); `retry: undefined` disables retrying.
- A `TomTomMap` takes the same keys in its constructor params, overriding the global values for that map.
- Node.js: the package is ESM only — `import`, not `require`. Read the key from `process.env`.

### Geopolitical view

`geopoliticalView` picks whose perspective disputed territories are shown from: the borders and names the map draws, and the country search and geocoding results report. Set globally, it reaches the map and every search, place details, geocoding and reverse geocoding call; a map's or a call's own `geopoliticalView` overrides it.

```ts
TomTomConfig.instance.put({ geopoliticalView: 'IN' });            // map + services
map.setGeopoliticalView('IN');                                     // an existing map only; reloads its tiles in place
await reverseGeocode({ position, geopoliticalView: 'Unified' });   // one call only
```

- `geopoliticalViews` (core) lists all 20 values of the `GeopoliticalView` type: `Unified` (international), `AE` (Arabic: Gulf states), and the country codes `AR`, `BN`, `CL`, `CN`, `DZ`, `IL`, `IN`, `KR`, `MA`, `MY`, `PH`, `PK`, `RS`, `RU`, `TR`, `TW`, `US`, `VN`.
- Unset, each API uses the default view for the caller's country; callers in India only ever get `IN`.
- A view an API does not serve is left out of its requests, so the call still succeeds in that default: map tiles skip `CN`, `RU`; search, place details and reverse geocoding skip `KR`, `US`; geocoding also skips `AE`, `BN`, `CL`, `DZ`, `MY`, `PH`, `VN`.
- `map.setGeopoliticalView(undefined)` returns the map to the caller's default view. It changes the map only: to keep map and services in agreement at runtime, call both `TomTomConfig.instance.put({ geopoliticalView })` and `map.setGeopoliticalView(geopoliticalView)`.

See [Geopolitical views](https://docs.tomtom.com/maps-sdk-js/guides/core/geopolitical-views.md).

---

## Per-call options

Every service call merges the global config under its own params, so a per-call `apiKey`, `language`, `geopoliticalView` or `commonBaseURL` wins for that call only. Endpoint paths and API versions are not configurable.

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

Call order: an already-aborted signal rejects first (no `onAPIRequest`) → global merge → validation → build request → `onAPIRequest` → send (with `429` retries) → `onAPIResponse` → parse.

- Aborting cancels the in-flight HTTP request, including a pending `429` retry wait.
- A deadline rejects with `SDKAbortError` too; `error.cause` (the signal's reason, a `TimeoutError` for `AbortSignal.timeout`) tells it apart from a manual abort.
- `discoverOnePlace` / `geocodeOne` take the signal in their params form: `discoverOnePlace({ query, signal })`. `calculateReachableRanges` takes it as a second argument — see `routing.md`.

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

- `apiRequest` is `{ url, headers, data? }` (a bare `URL` for EV charging availability); `onAPIResponse` gets the same object, and the error instead of a response on failure.
- Most services send the API key as `headers['TomTom-Api-Key']`, the rest as a `key=` URL parameter — redact both before logging.

---

## Error handling

Every rejection is an `SDKError` with `.code` (`SDKErrorCode`, core — branch on it, never on
`.message`), `.service` naming the service and `.sdkVersion`. Two subclasses carry more:

| `code` | When |
|---|---|
| `INVALID_REQUEST` | SDK validation failed (`.issues` = Zod issues), or API `400` / other `4xx` |
| `INSECURE_BASE_URL` | `commonBaseURL` is not `https:` and not loopback (`localhost`, `127.x`, `[::1]`) |
| `API_KEY_REJECTED` | API `401` / `403`: key missing, invalid, expired or not enabled for the API |
| `NOT_FOUND` | API `404` |
| `RATE_LIMITED` | API `429`, after the `retry` budget is spent |
| `SERVICE_UNAVAILABLE` | API `5xx` |
| `NETWORK_ERROR` | no response (offline, DNS, TLS, CORS); `.cause` = what `fetch` threw |
| `ABORTED` | signal aborted — an `SDKAbortError`, `name === 'AbortError'`, `.cause` = abort reason |
| `UNEXPECTED` | anything else, e.g. an unreadable response |

- `SDKServiceError` (API error status) adds `.status`; `403`/`429` get a standard `.message`.
- Under `createLatestRequest` a superseded call resolves `{ current: false }` instead, so the
  `ABORTED` that still reaches a `catch` is your own deadline.
- The map reports its failures with the same codes, as `TomTomMapError` (`map-setup.md` § Map errors).

```ts
import { discoverPlaces, SDKError } from '@tomtom-org/maps-sdk/services';

try {
    const results = await discoverPlaces({
        query: 'coffee',
        geoBias: { position: [4.9, 52.4] },
        signal: AbortSignal.timeout(5000),
    });
} catch (error) {
    if (!(error instanceof SDKError)) throw error;

    switch (error.code) {
        case 'ABORTED': console.error('Search timed out'); break;
        case 'INVALID_REQUEST': console.error('Bad request — check parameters', error.issues); break;
        case 'API_KEY_REJECTED': console.error('API key invalid or not enabled for this API'); break;
        case 'RATE_LIMITED': console.error('Rate limited, even after retrying'); break;
        case 'NETWORK_ERROR': console.error('No connection'); break;
        default: console.error(`${error.service} failed (${error.code}, SDK ${error.sdkVersion}):`, error.message);
    }
}
```

**Tip:** `geocodeOne()` and `discoverOnePlace()` throw a plain `Error` (not an `SDKError`) if no result — use `geocode()` / `discoverPlaces()` or wrap in try/catch when the query might not be found. Both take a query string or the params object minus `limit` — `discoverOnePlace({ query, geoBias, signal })`.

See [Request options and errors](https://docs.tomtom.com/maps-sdk-js/guides/services/request-options-and-errors.md).
