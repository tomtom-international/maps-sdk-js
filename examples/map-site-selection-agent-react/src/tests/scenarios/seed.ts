import type { ScriptStep } from '@langwatch/scenario';
import { priorTurn, toolCall } from '@testing/agent-tool-calling';

// A session in which a couple of analyses have already been run — a single-site profile and a
// shortlist ranking. generateSiteReport reads from session state, so a "write me the report" follow-up
// only routes correctly when there is something already analysed to report on. Used by
// generate-site-report.test.ts.
export const analysesRunSeed = (): ScriptStep[] =>
    priorTurn(
        'Profile Marnixstraat 250 Amsterdam for a coffee shop, then rank Damrak 70 and Keizersgracht 200 for the same concept',
        [
            toolCall(
                'profileSite',
                { address: 'Marnixstraat 250, Amsterdam', concept: 'coffee shop' },
                {
                    summary: 'Profiled Marnixstraat 250',
                    areaMakeup: { retail: 12, food: 8, office: 5, residential: 20 },
                },
            ),
            toolCall(
                'rankSites',
                { sites: ['Damrak 70', 'Keizersgracht 200'], concept: 'coffee shop' },
                {
                    summary: 'Ranked 2 sites',
                    ranking: [
                        { site: 'Keizersgracht 200', score: 71 },
                        { site: 'Damrak 70', score: 64 },
                    ],
                },
            ),
        ],
        'Done — profiled Marnixstraat 250 and ranked Damrak 70 and Keizersgracht 200 for a coffee shop. Results are in the panels.',
    );

// A session in which a BYOD layer is ALREADY loaded (via addByodSource, then styled). The tool result
// carries the real-looking entry id "candidate-parcels" and a data profile, exactly as the model would
// have observed it. Lets a follow-up like "rank those parcels…" test the reuse-by-id path — the agent
// should thread the loaded entry id into an analysis instead of re-loading. Used by byod.test.ts.
const PARCELS_URL = 'https://raw.githubusercontent.com/sebastian-meier/BerlinRefinedAssets/master/parcels.geojson';
export const byodLoadedSeed = (): ScriptStep[] =>
    priorTurn(
        `Load my candidate parcels from ${PARCELS_URL} and draw them`,
        [
            toolCall(
                'addByodSource',
                { label: 'Candidate parcels', url: PARCELS_URL },
                {
                    byodEntryId: 'candidate-parcels',
                    label: 'Candidate parcels',
                    source: { kind: 'url', url: PARCELS_URL },
                    profile: {
                        featureCount: 18,
                        geometryTypes: ['Polygon'],
                        properties: [
                            { name: 'name', types: ['string'], coverage: 1, examples: [] },
                            { name: 'E_E', types: ['number'], coverage: 1, examples: [1240, 980, 1620] },
                        ],
                    },
                },
            ),
            toolCall(
                'setByodLayers',
                { byodEntryId: 'candidate-parcels', layers: [{ type: 'fill' }] },
                { success: true, message: 'Layers set and drawn' },
            ),
        ],
        'Loaded your 18 candidate parcels (entry id: candidate-parcels) and drew them on the map.',
    );
