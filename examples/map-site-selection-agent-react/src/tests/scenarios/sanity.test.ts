import { MODEL } from '@testing/agent-tool-calling';
import { describe, expect, it } from 'vitest';
import { runToolScenario } from './helpers';

// No-collision suite. The site agent mixes its custom domain tools with generic built-ins (map control,
// geocoding). The generic tools' own routing is already covered by the agent-toolkit's scenarios, so we
// DON'T re-test it here — this suite only asserts the example-specific concern: a plain generic request
// is NOT hijacked by a look-alike domain tool (a "where is X" / "go to X" must stay in navigation, never
// profileSite / findWhitespace, etc.).
const DOMAIN_TOOLS = ['profileSite', 'rankSites', 'findWhitespace', 'compareCatchments', 'generateSiteReport'] as const;

const CASES: {
    name: string;
    expectedTool: string;
    prompt: string;
    acceptedAlternatives?: readonly string[];
    forbiddenTools?: readonly string[];
}[] = [
    {
        // "Fly to <named place>" legitimately routes to the camera tool OR the place locator (which also
        // flies there) — both are generic navigation. The check is that it stays out of the domain tools.
        name: 'navigate to a place stays in navigation, not a domain tool',
        expectedTool: 'flyTo',
        prompt: 'Fly to Rotterdam',
        acceptedAlternatives: ['locatePlace'],
        forbiddenTools: DOMAIN_TOOLS,
    },
    {
        name: 'a "where is X" query locates, never profiles/analyses',
        expectedTool: 'locatePlace',
        prompt: 'Where is the Rijksmuseum?',
        forbiddenTools: DOMAIN_TOOLS,
    },
    {
        // LSI-607: an explicit "show me all the <POIs> here" DISPLAY request must use the multi-result
        // search (renders every match), never locatePlace — which resolves a single place and left the
        // agent rendering just one parking pin.
        name: 'show me all the <POIs> here uses multi-result search, not single-place locate',
        expectedTool: 'discoverPlaces',
        prompt: 'Show me the parking in the current viewport',
        forbiddenTools: [...DOMAIN_TOOLS, 'locatePlace'],
    },
];

describe.skipIf(!MODEL)('no collision between generic and custom tools', { timeout: 180_000, retry: 3 }, () => {
    it.each(CASES)('$name', async ({ expectedTool, prompt, acceptedAlternatives, forbiddenTools }) => {
        const outcome = await runToolScenario({ expectedTool, prompt, acceptedAlternatives, forbiddenTools });
        expect(outcome.success, outcome.failureReason).toBe(true);
    });
});
