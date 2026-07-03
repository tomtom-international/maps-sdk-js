import {
    type Classifier,
    createDefaultClassifier,
    DEFAULT_TOOLS,
    type MapAgentOptions,
    SYSTEM_PROMPT_SECTIONS,
    type SystemPromptSectionOverrides,
    type ToolEntry,
} from '@tomtom-org/maps-sdk-plugin-agent-toolkit';
import type { LanguageModel } from 'ai';
import { clarifyIntent } from '../tools/clarify-intent';
import { compareCatchments } from '../tools/compare-catchments';
import { findWhitespace } from '../tools/find-whitespace';
import { generateSiteReport } from '../tools/generate-site-report';
import { lookupCategories } from '../tools/lookup-categories';
import { profileSite } from '../tools/profile-site';
import { rankSites } from '../tools/rank-sites';
import { updateSitePreferences } from '../tools/update-preferences';
import { methodologyPromptBlock } from './methodology';
import { SiteSelectionState, type SiteToolState } from './site-selection-state';

// Headless agent configuration for the Site Selection agent — the single source of truth shared by the
// React bootstrap (useAgentBootstrap) and the tool-selection scenario tests (src/tests/scenarios). Keep
// it free of React / map / telemetry concerns so it can be built from a bare model in either context.

// DEFAULT_TOOLS values are typed as the `ToolEntry | ToolEntryBuilder` union. Most built-ins picked
// below are plain entries; a few (analyseData, processData, recallState) are BUILDERS. The cast narrows
// them to ToolEntry for a tidy map — safe because the toolkit's setupTools (and the scenario adapter's
// resolveEntry) resolve a builder before use.
const builtin = DEFAULT_TOOLS as Record<string, ToolEntry>;

// Which tools the per-turn classifier is allowed to gate (drop from the active set). Everything NOT
// listed here is forced active by keepGenericToolsActive.
//
// The five core site analyses are deliberately NOT gated: they are this agent's whole reason to exist,
// and gating them proved unreliable — the classifier intermittently dropped findWhitespace for plainly
// matching prompts ("where in <area> has housing density but no supermarket within a 5-min walk?"),
// leaving the model unable to call it so it flailed on generic tools and claimed "no dedicated tool".
// Keeping them always-available makes that failure impossible; choosing the RIGHT one is handled by the
// model + the system-prompt TOOL CHOICE guidance + each tool's description, which is robust.
//
// We DO still gate the three tools whose mere presence invites misuse: analyseData / processData (the
// sandbox — only for computations the dedicated tools don't cover) and updateSitePreferences (must fire
// only on a STANDING preference, never a one-off request parameter like "…within a 10-min drive").
export const CLASSIFIER_GATED_TOOLS = ['analyseData', 'processData', 'updateSitePreferences'];
export const keepGenericToolsActive = (base: Classifier): Classifier => {
    // Computed once per classifier (not per turn): the always-active names are every tool that isn't
    // classifier-gated. The tool set is static for the session, so reading the keys once is enough.
    const alwaysActive = Object.keys(buildSiteTools()).filter((name) => !CLASSIFIER_GATED_TOOLS.includes(name));
    return async (context) => {
        const result = await base(context);
        if (!result) return result; // null is fail-open: every tool is already active.
        const missing = alwaysActive.filter((name) => !result.activeToolNames.includes(name));
        return missing.length ? { ...result, activeToolNames: [...result.activeToolNames, ...missing] } : result;
    };
};

// Per-section overrides onto the toolkit's SYSTEM_PROMPT_SECTIONS: override only what doesn't fit a
// scoped agent, reuse the rest. The act / never-narrate / clarify-on-ambiguity behaviour now lives in
// the toolkit base (its TOOL EXECUTION section) — this agent INHERITS it, so there's no toolExecution
// override here. Anything the tools already own (coordinate order, location routing) stays in their
// descriptions/schemas, not here.

// `identity` + `capabilities` are full replacements. We describe capabilities HOLISTICALLY — what the
// agent can do, not a tool-by-tool inventory — so this stays in sync as the `tools` map below changes,
// and we don't duplicate the per-tool names / inputs / when-to-use that the classifier and the tool
// descriptions already carry in full.
const SITE_IDENTITY =
    'You are the TomTom Site Selection Agent — a conversational co-pilot for deciding where to open, ' +
    'relocate, or close a physical retail/service location, backed by live TomTom location data, the ' +
    "user's own bring-your-own-data (BYOD) layers, and an extensible toolkit of analysis, data, and map tools.";

const SITE_CAPABILITIES =
    'Everything you do runs through your tools — never imply, promise, or ask to use a capability they ' +
    "don't give you. Together they let you size up a single candidate site, rank a shortlist of sites, " +
    'scan an area for opportunity gaps (whitespace), check catchment overlap between sites, and compile ' +
    'a site report — supported by resolving places/addresses, looking up POI categories, asking the user ' +
    'a quick clarifying form, and driving the map (camera, style, POI tiles, clearing).\n\n' +
    "BRING-YOUR-OWN-DATA: you can load the customer's own GeoJSON layers by URL (addByodSource returns a " +
    'profile of the data), restyle them (setByodLayers), and — crucially — FEED them into the analyses: ' +
    'rank the features of a BYOD layer as candidate sites (polygons/lines by their centroid), score Spend ' +
    'power from a BYOD demand layer, scan ' +
    'whitespace against BYOD demand points, or compare against a BYOD store network. You can also analyse ' +
    'loaded data (analyseData) and author NEW derived layers from it (processData).\n\n' +
    'SESSION PREFERENCES: catchment size, travel mode, scoring weights and demand anchors are remembered ' +
    'for the session (updateSitePreferences) and inherited by every analysis until changed.\n\n' +
    'Each tool describes its own exact inputs and when to use it — rely on that, never guess a capability.\n' +
    'When you are missing a required input or a definition is ambiguous (which site/address, the concept, ' +
    'what counts as a competitor or demand, walking vs driving catchment, how to weight factors), gather ' +
    'it by CALLING clarifyIntent — that form is your only way to ask. Never request the details in chat ' +
    'prose ("I need…", "please provide…") and never guess them.\n\n' +
    'YOU OWN THIS LIVE MAP. Every analysis tool draws its results directly onto it, and the map-control ' +
    'tools move, restyle, and clear it. NEVER say you cannot see or change the map — you can.';

// `rejectionRules`: KEEP the generic base policy (in-scope-part handling, decline-and-describe,
// scope-creep, illegal requests), then EXTEND it with only the site-specific additions the base
// doesn't already cover: the no-external-pointers boundary and the concrete out-of-scope list.
const SITE_REJECTIONS =
    `${SYSTEM_PROMPT_SECTIONS.rejectionRules}\n` +
    '- Stay inside your tools: never invent a workaround, hand the user manual steps, or point them to an ' +
    'external map, website, or tool. (Loading a customer data layer by URL via addByodSource is bringing ' +
    'data IN — that is allowed and encouraged.) State a missing capability in ONE plain sentence.\n' +
    '- Out of scope (state plainly if asked; never improvise a substitute): live or historical traffic, ' +
    'vehicle volume / vehicle mix, and footfall / pedestrian counts. Demographics / income / spend power ' +
    'come ONLY from a BYOD layer the user loads — never from your own world knowledge.';

// `sessionState`: full replacement tuned to this agent — panels + BYOD layers + remembered preferences.
const SITE_SESSION_STATE =
    '- Analyses you run accumulate as on-screen panels for the session; later tools (e.g. ' +
    'generateSiteReport) read those results from session state rather than from your messages, so you ' +
    'can build on earlier analyses without re-running them.\n' +
    '- Loaded BYOD layers and their entry ids persist for the session — use recallState to see what is ' +
    'loaded and reuse a layer by id across analyses instead of re-loading it.\n' +
    '- Session preferences (catchment, weights, demand anchors) set via updateSitePreferences carry across ' +
    'turns; a later analysis inherits them unless its own arguments override them.';

// `responseFormatting`: KEEP the base markdown/bold/bullets/concise rules; add only the site nuance
// the base doesn't cover — the panels hold the data, so the chat reply is a tight, structured signpost.
const SITE_RESPONSE_FORMATTING =
    `${SYSTEM_PROMPT_SECTIONS.responseFormatting}\n` +
    '- PANELS ARE THE REPORT; your chat reply is a signpost. Every analysis tool writes its full results ' +
    'to on-screen panels — so a panel exists only after you call its tool THIS turn ("Profiling…" / "check ' +
    'the panel" is never a reply on its own; call the tool first, signpost after it returns).\n' +
    '- After a tool returns, reply in ONE line (the headline finding + panel pointer); add a second line ' +
    'only for a genuinely non-obvious read. For multiple items use a tight bulleted list, never a paragraph.\n' +
    '- NEVER restate panel numbers (counts, distances, scores, %) — they are on screen. No preamble or ' +
    'closing summary; end with at most ONE follow-up, only when a real next step is open.';

// `dataConfidence`: KEEP the base incomplete/partial/conflicting-data policy; add the site's
// tool-data-only rule (no answering from world knowledge), which the base doesn't address.
const SITE_DATA_CONFIDENCE =
    `${SYSTEM_PROMPT_SECTIONS.dataConfidence}\n` +
    '- Answer ONLY from tool output in this conversation — never characterize a location or area from ' +
    'your own world knowledge (no history, reputation, "vibe", or typical-land-use claims). When asked ' +
    '"what kind of area is X", run profileSite (use a generic concept like "shop" if none was given) and ' +
    'answer only from its areaMakeup counts; residential character is not measurable.';

// Cross-cutting site-specific guidance appended as the composed prompt's suffix (under `ADDITIONAL
// INSTRUCTIONS`). The act / never-narrate / clarify-on-implied-or-missing-context behaviour is the
// toolkit's base default (its TOOL EXECUTION section) — this agent INHERITS it rather than restating it.
// Per-tool mechanics live in each tool's own `description`. This keeps only the site-specific
// cross-cutting bits: how to pick between the dedicated tools and the escape hatches, the BYOD workflow,
// the preferences rule, and the map legend. Data-only answering → SITE_DATA_CONFIDENCE.
const SITE_TOOLS_GUIDANCE =
    'TOOL CHOICE — the dedicated analyses (profileSite, rankSites, findWhitespace, compareCatchments) are ' +
    'ALWAYS the first choice for their job; they run their own search + reach internally and draw the rich ' +
    'panels. A request to find a gap / opportunity zone / under-served area is findWhitespace even when it ' +
    'mentions a drive time, a walk time, a store type, or housing/residential density — do not reach for a ' +
    'generic primitive or claim no tool exists. A plain "show / find / map all the <POIs> here / in <area>" ' +
    'DISPLAY request that is NOT part of an analysis (e.g. "show me the parking in this viewport") is ' +
    'discoverPlaces — it renders every match as pins; locatePlace resolves only ONE named place, so never ' +
    'use it for a category or multi-place request. Use analyseData / processData only for a computation the ' +
    'dedicated tools do not cover (a custom metric over already-loaded data, or authoring a derived / BYOD ' +
    'layer). ' +
    'BRING-YOUR-OWN-DATA — load a layer with addByodSource (URL), read the profile it returns, then style ' +
    "with setByodLayers; to ANALYSE the user's data, pass its entry id into an analysis " +
    '(candidatesByodEntryId / demandByodEntryId / existingByodEntryId), not by eyeballing the map. ' +
    'PREFERENCES — call updateSitePreferences ONLY for a STANDING default the user wants to persist ' +
    '("from now on…", "always…", "by default…"). A value scoped to the current request ("…within a 10-min ' +
    'drive" for THIS scan) is NOT a preference — pass it as that analysis tool\'s argument instead. ' +
    'MAP LEGEND — answer questions about map markers ONLY from this: RED dots = competitors / peers; BLUE ' +
    'dots = parking; in a whitespace scan the demand POIs are dots COLOURED BY CATEGORY (legend in the ' +
    'Opportunities panel); a dashed line = distance to the nearest competitor or parking; catchment circles / ' +
    'shaded areas = walk/drive reach; numbered coloured hexagons = whitespace opportunity pockets. Every dot ' +
    'is clickable and shows its name + category.';

/** The per-section system-prompt overrides composed onto the toolkit base for this scoped agent. */
export const siteSystemPromptSections: SystemPromptSectionOverrides = {
    identity: SITE_IDENTITY,
    capabilities: SITE_CAPABILITIES,
    rejectionRules: SITE_REJECTIONS,
    responseFormatting: SITE_RESPONSE_FORMATTING,
    dataConfidence: SITE_DATA_CONFIDENCE,
    sessionState: SITE_SESSION_STATE,
};

/** Operating procedure + methodology, appended under the toolkit's `ADDITIONAL INSTRUCTIONS` heading. */
export const buildSiteSystemPromptSuffix = (): string => `${SITE_TOOLS_GUIDANCE}\n\n${methodologyPromptBlock()}`;

export const SITE_AGENT_MAX_STEPS = 10;

// The site domain tools, PLUS the session-preferences tool, PLUS generic built-ins: map control +
// viewport, geocoding primitives, discoverPlaces (multi-result POI search), the BYOD trio
// (bring-your-own-data layers at runtime), the data/sandbox escape hatches (analyseData, processData,
// recallState), and pure utilities. The escape hatches let the agent run ad-hoc analysis over loaded
// data and author derived layers the fixed tools don't cover; the prompt steers it to the dedicated
// tools first. discoverPlaces handles explicit "show me the X here" display requests the analyses don't
// cover (they search internally but draw no free-standing pins); the isochrone primitive
// findReachableAreas overlaps the domain tools' reach internals, so it (and out-of-scope routing/
// traffic) stays out.
export const buildSiteTools = (): Record<string, ToolEntry> => ({
    profileSite,
    rankSites,
    findWhitespace,
    compareCatchments,
    generateSiteReport,
    clarifyIntent,
    lookupCategories,
    // Session preferences (catchment, weights, demand anchors) — make standing choices stick:
    updateSitePreferences,
    // Map control & camera (no overlap — fixes "I can't change the map"):
    flyTo: builtin.flyTo,
    zoomInOrOut: builtin.zoomInOrOut,
    setPitchBearing: builtin.setPitchBearing,
    getViewport: builtin.getViewport,
    setMapStandardStyle: builtin.setMapStandardStyle,
    getStandardMapStyles: builtin.getStandardMapStyles,
    clearMap: builtin.clearMap,
    setLanguage: builtin.setLanguage,
    toggleTilesPOIs: builtin.toggleTilesPOIs,
    // Location primitives (no overlap — fixes the "ask for location then can't" loop):
    locatePlace: builtin.locatePlace,
    reverseGeocode: builtin.reverseGeocode,
    getCurrentLocation: builtin.getCurrentLocation,
    // Multi-result POI search + render — fulfils explicit "show me all the parking/EV chargers/… here"
    // display requests that no dedicated analysis covers (locatePlace resolves only ONE place).
    discoverPlaces: builtin.discoverPlaces,
    // Bring-your-own-data: load a customer GeoJSON layer (by URL), restyle it, and toggle/remove it.
    // Always-active (not classifier-gated) — an available capability, like the map controls.
    // addByodSource returns a data profile the agent uses to drive setByodLayers paint. This demo puts
    // no host allowlist on the URL (any http(s) source is accepted); the toolkit still enforces its
    // built-in scheme / size / timeout limits and strips customer string values from the profile it
    // returns to the model. A production app should add its own policy via MapAgentOptions.byod.
    // validateSourceUrl (e.g. a signed-URL service or a tenant-origin check).
    addByodSource: builtin.addByodSource,
    setByodLayers: builtin.setByodLayers,
    updateByodDisplay: builtin.updateByodDisplay,
    // Data / sandbox escape hatches. analyseData runs ad-hoc analysis over loaded entries (incl. BYOD);
    // processData authors NEW renderable layers (incl. agent-authored BYOD); both are classifier-gated.
    // recallState (always-active, cheap) lists what's loaded. findReachableAreas stays out — its reach
    // computation overlaps the domain tools' own catchment internals.
    analyseData: builtin.analyseData,
    processData: builtin.processData,
    recallState: builtin.recallState,
    // Pure utilities (harmless; `help` lets the agent list its real capabilities):
    help: builtin.help,
    calculateBBox: builtin.calculateBBox,
});

/**
 * Builds the full {@link MapAgentOptions} for the Site Selection agent from a bare model. The React
 * bootstrap layers `onClassify` on top; the scenario tests override `tools` with mocked executes.
 * Everything else (the scoped system prompt, the meta-tool-preserving classifier, the hand-picked tool
 * set, maxSteps) is shared so the tested agent matches the shipped one.
 */
export const buildSiteAgentOptions = (model: LanguageModel): MapAgentOptions<SiteToolState> => ({
    model,
    maxSteps: SITE_AGENT_MAX_STEPS,
    systemPrompt: siteSystemPromptSections,
    systemPromptSuffix: buildSiteSystemPromptSuffix(),
    classifier: keepGenericToolsActive(createDefaultClassifier({ model })),
    includeDefaultTools: false,
    tools: buildSiteTools(),
    // Session-preferences slice (catchment size, scoring weights, demand anchors) — runtime-mutable
    // defaults the domain tools and the sandbox read instead of hardcoding thresholds.
    state: { siteSelection: new SiteSelectionState() },
});
