// This manipulates the imported SDK dependencies in the test code itself (node.js), not the target code running in the test browsers

// - Ensures imports to '@tomtom-org/maps-sdk-js/core' within SDK don't crash.

// - Mocks SVG imports with ?raw for Node.js (Playwright)
// -- Allows tests to import SDK code that references raw SVG assets without breaking under Node.

// (CommonJS version (package is not ESM due to how playwright works with nodejs)).
const Module: any = require('module');
if (!Module.__patched) {
    const originalLoad = Module._load;
    const aliasMap: Record<string, string> = {
        '@tomtom-org/maps-sdk-js/core': 'core',
    };
    Module._load = function (request: string, parent: unknown, isMain: boolean) {
        const mapped = aliasMap[request];
        if (mapped) {
            return originalLoad.apply(this, [mapped, parent, isMain]);
        }
        if (request.endsWith('.svg?raw')) {
            return '';
        }
        return originalLoad.apply(this, arguments);
    };
    Module.__patched = true;
}
