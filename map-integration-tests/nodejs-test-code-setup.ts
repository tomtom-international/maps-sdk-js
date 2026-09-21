// This manipulates the imported SDK dependencies in the test code itself (node.js), not the target code running in the test browsers

// - Ensures imports to '@tomtom-org/maps-sdk/core' within SDK don't crash.

// - Mocks SVG imports with ?raw for Node.js (Playwright)
// -- Allows tests to import SDK code that references raw SVG assets without breaking under Node.

// (CommonJS version (package is not ESM due to how playwright works with nodejs)).
const Module: any = require('module');
if (!Module.__patched) {
    const originalLoad = Module._load;
    const aliasMap: Record<string, string> = {
        '@tomtom-org/maps-sdk/core': 'core',
    };
    Module._load = function (request: string, parent: unknown, isMain: boolean) {
        const mapped = aliasMap[request];
        if (mapped) {
            return originalLoad.apply(this, [mapped, parent, isMain]);
        }
        if (request.endsWith('.svg?raw')) {
            return '';
        }
        // maplibre-gl v6 is ESM-only (its package `exports` has no `main`/`require`
        // entry), so a CommonJS require() through this patch can't resolve it. The SDK
        // never invokes maplibre-gl in Node — it only runs in the test browsers — so
        // return a self-referential no-op stub: any property access / call / construct
        // yields the same stub, so destructured imports never throw at load time.
        // (`maplibre-gl/package.json`, used for the version, still resolves normally.)
        if (request === 'maplibre-gl') {
            const stub: any = new Proxy(() => {}, {
                get: () => stub,
                apply: () => stub,
                construct: () => stub,
            });
            return stub;
        }
        return originalLoad.apply(this, arguments);
    };
    Module.__patched = true;
}
