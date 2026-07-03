import { MODEL } from '@testing/agent-tool-calling';
import { describe, expect, it } from 'vitest';
import { runToolScenario } from './helpers';
import { byodLoadedSeed } from './seed';

// BYOD (bring-your-own-data) routing scenarios. Unlike the per-tool files, every case here is a SINGLE
// prompt that both names a data URL and asks for an analysis, so the agent has to chain
// `addByodSource` → the right domain tool in one turn (the tool executes are mocked; no fetch happens —
// see site-agent-adapter). Each scenario covers one BYOD input param: candidatesByodEntryId /
// demandByodEntryId (rankSites), existingByodEntryId (compareCatchments), demandByodEntryId
// (findWhitespace), plus reusing an already-loaded layer by id. `inOrder` asserts the load precedes the
// analysis; `forbiddenTools` rules out the sibling analyses. These are the exact flows the PR documents.

// Real, public GeoJSON URLs. Never fetched here — the executes are mocked — but kept realistic so the
// prompts read like the app's own examples.
const SCHOOLS_URL =
    'https://raw.githubusercontent.com/sebastian-meier/BerlinRefinedAssets/master/tools/fisbroker/moabit/re_schulstand.geojson';
const POPULATION_URL =
    'https://raw.githubusercontent.com/mxfh/LOR-Berlin/master/Planungsraum_WGS84_konsolidiert.geojson';
// Berlin districts (Bezirke): the human name lives in `spatial_alias` ("Mitte", "Pankow", …), which the
// LABEL_KEYS heuristic (label/name/title/site/address/id) does NOT cover — so the agent has to name the
// label field via rankSites' `candidatesLabelProperty`, or the sites fall back to "Site 1/2/…".
const DISTRICTS_URL = 'https://raw.githubusercontent.com/m-hoerz/berlin-shapes/master/berliner-bezirke.geojson';

describe.skipIf(!MODEL)('BYOD scenarios', { timeout: 180_000, retry: 3 }, () => {
    it('loads a layer and ranks it as candidate sites in one prompt', async () => {
        const outcome = await runToolScenario({
            expectedTool: 'rankSites',
            prompt: `Load candidate sites from ${SCHOOLS_URL} and rank those locations for a café`,
            inOrder: ['addByodSource', 'rankSites'],
            forbiddenTools: ['profileSite', 'findWhitespace', 'compareCatchments'],
        });
        expect(outcome.success, outcome.failureReason).toBe(true);
    });

    it('loads a district layer and ranks its features, naming the label field the heuristic would miss', async () => {
        const outcome = await runToolScenario({
            expectedTool: 'rankSites',
            prompt:
                `Load the Berlin districts from ${DISTRICTS_URL} and rank those districts for a flagship store — ` +
                'label each site by its spatial_alias',
            inOrder: ['addByodSource', 'rankSites'],
            forbiddenTools: ['profileSite', 'findWhitespace', 'compareCatchments'],
        });
        expect(outcome.success, outcome.failureReason).toBe(true);
    });

    it('loads a population layer and ranks addresses scoring Spend power from it, in one prompt', async () => {
        const outcome = await runToolScenario({
            expectedTool: 'rankSites',
            prompt:
                `Load Berlin population areas from ${POPULATION_URL}, then rank Kurfürstendamm 21, ` +
                'Alexanderplatz 1 and Schloßstraße 34 for a specialty coffee shop and score Spend power from that ' +
                "layer's E_E population",
            inOrder: ['addByodSource', 'rankSites'],
            forbiddenTools: ['findWhitespace', 'compareCatchments'],
        });
        expect(outcome.success, outcome.failureReason).toBe(true);
    });

    it('loads an existing store network and runs a cannibalization check in one prompt', async () => {
        const outcome = await runToolScenario({
            expectedTool: 'compareCatchments',
            prompt:
                `Load my existing stores from ${SCHOOLS_URL} and check whether a new store at Turmstraße 75 would ` +
                'cannibalize that network within a 10-minute drive',
            inOrder: ['addByodSource', 'compareCatchments'],
            forbiddenTools: ['rankSites', 'findWhitespace'],
        });
        expect(outcome.success, outcome.failureReason).toBe(true);
    });

    it('loads demand points and scans for whitespace using them, in one prompt', async () => {
        const outcome = await runToolScenario({
            expectedTool: 'findWhitespace',
            prompt:
                `Load my demand points from ${SCHOOLS_URL} and find whitespace for a supermarket in Berlin-Mitte, ` +
                'using them as extra demand',
            inOrder: ['addByodSource', 'findWhitespace'],
            forbiddenTools: ['rankSites', 'compareCatchments'],
        });
        expect(outcome.success, outcome.failureReason).toBe(true);
    });

    it('reuses a layer already loaded this session instead of re-loading it', async () => {
        const outcome = await runToolScenario({
            expectedTool: 'rankSites',
            prompt: 'Rank those candidate parcels for a pharmacy',
            priorTurns: byodLoadedSeed,
            forbiddenTools: ['profileSite', 'findWhitespace', 'compareCatchments'],
        });
        expect(outcome.success, outcome.failureReason).toBe(true);
    });
});
