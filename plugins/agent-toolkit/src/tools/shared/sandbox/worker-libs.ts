/**
 * @module agent-toolkit-tools
 *
 * Zero-config library source for the iframe-worker sandbox. The worker needs
 * `turf` / `h3` as a self-contained string (it can't `import` the host app's
 * peer-dep modules across the worker boundary), so we inline their published
 * UMD bundles via Vite `?raw`. Each UMD attaches to the worker's global
 * (`self.turf` / `self.h3`) when evaluated.
 *
 * This module is **dynamically imported** by the executor only when iframe-worker
 * mode actually runs, so the ~600 KB of UMD source lands in a lazy chunk and
 * never bloats the main entry (where turf / h3 stay externalized peer deps).
 *
 * `sandbox-turf-umd` / `sandbox-h3-umd` are build-time aliases (see
 * `vite-sandbox-build.ts`) pointing at `@turf/turf/turf.min.js` and
 * `h3-js/dist/h3-js.umd.js`. Both bypass peer-dep externalization so the `?raw`
 * import is inlined as text rather than kept as a runtime module import (which would
 * resolve to the module object, not its source). turf additionally needs the alias
 * because its `exports` map blocks importing the UMD subpath directly.
 */

import h3Umd from 'sandbox-h3-umd?raw';
import turfUmd from 'sandbox-turf-umd?raw';
// Bundled SDK worker-utilities IIFE (`routeUtils`, …) from the build-time virtual
// module. Evaluated AFTER turf so it can read `self.turf`; assigns `self.routeUtils`
// (and any future groups). See the `sandbox-sdk-utils` plugin in `vite-sandbox-build.ts`
// and `sdk-utils-worker-entry.ts`.
import { source as sdkUtilsSource } from 'virtual:sandbox-sdk-utils';

/**
 * Concatenated turf + h3 UMD source plus the bundled SDK worker-utilities IIFE.
 * Evaluated at the top of the sandbox worker, it defines `self.turf`, `self.h3`, and
 * the SDK utility groups (`self.routeUtils`, …) for the generated code to use. Order
 * matters: turf first, since `routeUtils` reads `self.turf`.
 *
 * @ignore
 */
export const sandboxLibrarySource = `${turfUmd}\n;${h3Umd}\n;${sdkUtilsSource}`;
