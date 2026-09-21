/**
 * Refreshes the compiled-style fixture the styling version-guard tests run against, from the live
 * TomTom Orbis style at the version the SDK pins. Run it as part of a style-version bump:
 *
 *   API_KEY_TESTS=… pnpm -F map refresh-style-fixture [styleVersion] [flavor]
 *
 * Only the base-map, traffic and hillshade layers are kept, and only the properties the styling
 * knobs read or rewrite, so the fixture stays small and the diff on a bump stays readable.
 */

import { readFileSync, writeFileSync } from 'node:fs';
import { dirname, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';

const scriptDirectory = dirname(fileURLToPath(import.meta.url));

const apiKey = process.env.API_KEY_TESTS;
if (!apiKey) {
    console.error('API_KEY_TESTS is required to fetch the live style.');
    process.exit(1);
}

// The fixture has to describe the style the SDK pins, so the default version is read off that pin.
// Node cannot import the module holding it (its own relative imports carry no extension), hence the
// read: a second copy of the version here is what silently sends the guard at the wrong style.
const pinnedStyleVersion = readFileSync(resolve(scriptDirectory, '../src/init/styleInputBuilder.ts'), 'utf8').match(
    /DEFAULT_STYLE_VERSION = '([^']+)'/,
)?.[1];
if (!pinnedStyleVersion) {
    console.error('Could not read DEFAULT_STYLE_VERSION from map/src/init/styleInputBuilder.ts.');
    process.exit(1);
}

const [styleVersion = pinnedStyleVersion, flavor = 'basic_street-light'] = process.argv.slice(2);

const KEEP_SOURCES = new Set(['vectorTiles', 'vectorTilesFlow', 'vectorTilesIncidents', 'hillshade']);
const LAYOUT_KEYS = new Set(['text-size', 'icon-size', 'visibility', 'text-font', 'text-field', 'icon-image']);
const PAINT_KEYS = new Set([
    'line-width',
    'line-color',
    'text-color',
    'text-halo-color',
    'fill-color',
    'fill-extrusion-color',
    'background-color',
    'hillshade-exaggeration',
]);

const url = new URL(`https://api.tomtom.com/maps/orbis/assets/styles/${styleVersion}/style.json`);
url.searchParams.set('apiVersion', '1');
url.searchParams.set('key', apiKey);
url.searchParams.set('map', flavor);
url.searchParams.set('trafficIncidents', 'incidents_light');
url.searchParams.set('trafficFlow', 'flow_relative-light');
url.searchParams.set('hillshade', 'hillshade_light');

const response = await fetch(url);
if (!response.ok) {
    console.error(`Style request failed: ${response.status} ${response.statusText}`);
    process.exit(1);
}
const style = await response.json();

const pick = (record, keys) => Object.fromEntries(Object.entries(record ?? {}).filter(([key]) => keys.has(key)));

const layers = style.layers
    .filter((layer) => layer.type === 'background' || KEEP_SOURCES.has(layer.source))
    .map((layer) => {
        const keepFilter =
            layer['source-layer'] === 'poi' || ['vectorTilesFlow', 'vectorTilesIncidents'].includes(layer.source);
        const trimmed = { id: layer.id, type: layer.type };
        for (const key of ['source', 'source-layer', 'minzoom', 'maxzoom', ...(keepFilter ? ['filter'] : [])]) {
            if (key in layer) trimmed[key] = layer[key];
        }
        if (typeof layer.metadata?.group === 'string') trimmed.metadata = { group: layer.metadata.group };
        const layout = pick(layer.layout, LAYOUT_KEYS);
        const paint = pick(layer.paint, PAINT_KEYS);
        if (Object.keys(layout).length) trimmed.layout = layout;
        if (Object.keys(paint).length) trimmed.paint = paint;
        return trimmed;
    });

const themeMetadata = style.metadata?.['tomtom:theme'];
const header = `/**
 * Trimmed compiled Orbis style, used by the styling version-guard tests: every curated knob must
 * still reach at least one of these layers, and the expression transforms are exercised against the
 * real compiled shapes (nested match-in-interpolate, legacy stops objects, display_class filters).
 *
 * Source: the live style at version \`${styleVersion}\`, flavor \`${flavor}\`, style \`tomtom:version\`
 * \`${style.metadata?.['tomtom:version'] ?? 'unknown'}\`${themeMetadata ? ` (carries tomtom:theme ${themeMetadata['theme:version'] ?? ''})` : ''}.
 * Only the base-map, traffic and hillshade layers are kept, and only the properties the styling
 * knobs read or rewrite.
 *
 * Regenerate against the live pinned style with \`pnpm -F map refresh-style-fixture\` (needs API_KEY_TESTS).
 */
import type { LayerSpecification } from 'maplibre-gl';

export const orbisStreetLightLayers = `;

const output = resolve(scriptDirectory, '../src/styling/tests/data/orbisStreetLightLayers.data.ts');
writeFileSync(output, `${header}${JSON.stringify(layers)} as unknown as LayerSpecification[];\n`);
console.log(
    `Wrote ${layers.length} layers to ${output}. Run \`pnpm -F map lint:fix\` to format, then the styling tests.`,
);
