import { readFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { describe, expect, test } from 'vitest';
import { stylingKnobIds } from '../knobCatalogue';

// The skill doc is what an AI coding agent has in context when there is no map to interrogate, so
// every knob id has to appear in it verbatim — a shorthand like `.slowColor` is what makes an agent
// emit an id that does not exist. `describe()` covers the runtime case; this covers build time.
const docPath = fileURLToPath(
    new URL('../../../../.claude/skills/tomtom-maps-sdk-js/docs/map-styling.md', import.meta.url),
);
const doc = readFileSync(docPath, 'utf8');

// The ids table only; prose elsewhere mentions ids in passing and is not the agent's lookup.
const knobIdTable = (): string => {
    const section = /## Knob ids\n([\s\S]*?)\n## /.exec(doc);
    if (!section) throw new Error(`No '## Knob ids' section in ${docPath}`);
    return section[1];
};

// Anything backticked in the table that looks like `<namespace>.<something>`, so a renamed knob left
// behind in the doc is caught as well as a new one missing from it.
const namespaces = new Set(stylingKnobIds.map((id) => id.split('.')[0]));

const documentedIds = (): string[] => {
    const backticked = knobIdTable().match(/`[^`]+`/g) ?? [];
    return backticked
        .map((token) => token.slice(1, -1))
        .filter((token) => token.includes('.') && namespaces.has(token.split('.')[0]));
};

describe('styling knob ids are documented for build-time agents', () => {
    test('every knob id appears verbatim in the skill doc', () => {
        const documented = new Set(documentedIds());
        const missing = stylingKnobIds.filter((id) => !documented.has(id));
        expect(missing, `Add these to the 'Knob ids' table in ${docPath}`).toEqual([]);
    });

    test('the skill doc lists no knob id that does not exist', () => {
        const real = new Set<string>(stylingKnobIds);
        const stale = documentedIds().filter((id) => !real.has(id));
        expect(stale, `These ids are in ${docPath} but not in knobDefinitions`).toEqual([]);
    });
});
