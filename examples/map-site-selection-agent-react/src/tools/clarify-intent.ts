import { createClarifyIntentTool } from '@tomtom-org/maps-sdk-plugin-agent-toolkit';

// Reuse the toolkit's clarifyIntent as-is — its schema, execute, and "silent form" usage contract are
// exactly what this agent needs, and the chat UI renders the questions as the Survey-wizard form
// (see chat/ClarifyForm), so `rendersForm: true` selects that contract. We don't override the
// description: the WHAT-to-ask-about (demand anchors, competitor definition, scoring weights, catchment
// mode) already lives in each analysis tool's own description — surfaced to the model when that tool is
// active — so it drives the form's question/option quality without a duplicated guardrail here.
//
// The examplePrompts below stand in for the domain coverage the old hand-written description carried:
// one per definitional choice it used to call out (missing concept, travel mode / catchment, demand
// anchors, competitor/peer, scoring weights, missing sites) so every clarify scenario stays exercised.
export const clarifyIntent = createClarifyIntentTool({
    rendersForm: true,
    examplePrompts: [
        'Profile this site for me (no concept or travel mode given)',
        'Rank these addresses (no concept given)',
        'Profile Damrak 70 — I’m not sure whether to use a walking or driving catchment',
        'Find demand gaps for a gym in Amsterdam Oost — help me pick what counts as nearby demand',
        'Rank these sites for a clinic — I’m not sure what should count as a competitor',
        'Rank these candidate sites, but I’m not sure how to weigh the factors',
        'Compare a proposed store with my existing locations — I haven’t listed the addresses yet',
    ],
});
