import { FULL_SCENARIOS, MODEL, priorTurn } from '@testing/agent-tool-calling';
import { describe, expect, it } from 'vitest';
import { getExamplePrompts, runToolScenario } from './helpers';
import { toolCall } from './seed';

// Operations over an ALREADY-LOADED incidents entry: focus a subset, cluster, and start/stop the
// poll. Replay a loaded entry plus the monitor start (so "stop refreshing" has a monitor to stop).
// "Focus on the 3 worst by delay" legitimately routes to analyseData FIRST (rank by delay) before
// focusing — the classificationPrompt itself says "compose with analyseData to compute the ids".
// With mocked tool outputs the analyseData result carries no ids, so the agent often stops at that
// step; analyseData is therefore an accepted alternative for the focus prompts (same overlap pattern
// as queryTrafficAnalytics ↔ analyseData).
const loadedIncidentsSeed = () =>
    priorTurn(
        'Load the live traffic incidents around Amsterdam',
        [
            toolCall(
                'getTrafficIncidents',
                { where: { near: 'Amsterdam' } },
                {
                    count: 18,
                    entryId: 'incidents-0',
                    entries: [{ id: 'incidents-0', label: 'Amsterdam incidents', count: 18, timestamp: 0 }],
                },
            ),
            toolCall(
                'setTrafficIncidentsMonitor',
                { incidentsEntryID: 'incidents-0', enabled: true },
                { incidentsEntryID: 'incidents-0', enabled: true, alreadyInState: false },
            ),
        ],
        'Loaded 18 live traffic incidents around Amsterdam — jams, several accidents, roadworks and a closure on the ' +
            'A4 — and I am refreshing them every 60 seconds.',
    );

describe.skipIf(!MODEL)('focusIncidents scenarios', { timeout: 180_000, retry: 3 }, () => {
    const [canonical, ...rest] = getExamplePrompts('focusIncidents');
    // "Focus on the worst N…" reasonably ranks via analyseData before focusing; "highlight the
    // closures" may refresh via getTrafficIncidents first — accept those routes too.
    const acceptedAlternatives = ['analyseData', 'getTrafficIncidents'] as const;
    it(`classifies the canonical prompt: ${canonical}`, async () => {
        const outcome = await runToolScenario({
            expectedTool: 'focusIncidents',
            prompt: canonical,
            acceptedAlternatives,
            priorTurns: loadedIncidentsSeed,
        });
        expect(outcome.success, outcome.failureReason).toBe(true);
    });
    it.skipIf(!FULL_SCENARIOS).each(rest)('handles registry examplePrompt: %s', async (prompt) => {
        const outcome = await runToolScenario({
            expectedTool: 'focusIncidents',
            prompt,
            acceptedAlternatives,
            priorTurns: loadedIncidentsSeed,
        });
        expect(outcome.success, outcome.failureReason).toBe(true);
    });
});

describe.skipIf(!MODEL)('clusterIncidents scenarios', { timeout: 180_000, retry: 3 }, () => {
    const [canonical, ...rest] = getExamplePrompts('clusterIncidents');
    it(`classifies the canonical prompt: ${canonical}`, async () => {
        const outcome = await runToolScenario({
            expectedTool: 'clusterIncidents',
            prompt: canonical,
            priorTurns: loadedIncidentsSeed,
        });
        expect(outcome.success, outcome.failureReason).toBe(true);
    });
    it.skipIf(!FULL_SCENARIOS).each(rest)('handles registry examplePrompt: %s', async (prompt) => {
        const outcome = await runToolScenario({
            expectedTool: 'clusterIncidents',
            prompt,
            priorTurns: loadedIncidentsSeed,
        });
        expect(outcome.success, outcome.failureReason).toBe(true);
    });
});

// One toggle now arms AND pauses polling — its examplePrompts span both ("keep updated" / "refresh
// every N seconds" / "stop refreshing"), all routing to setTrafficIncidentsMonitor.
describe.skipIf(!MODEL)('setTrafficIncidentsMonitor scenarios', { timeout: 180_000, retry: 3 }, () => {
    const [canonical, ...rest] = getExamplePrompts('setTrafficIncidentsMonitor');
    it(`classifies the canonical prompt: ${canonical}`, async () => {
        const outcome = await runToolScenario({
            expectedTool: 'setTrafficIncidentsMonitor',
            prompt: canonical,
            priorTurns: loadedIncidentsSeed,
        });
        expect(outcome.success, outcome.failureReason).toBe(true);
    });
    it.skipIf(!FULL_SCENARIOS).each(rest)('handles registry examplePrompt: %s', async (prompt) => {
        const outcome = await runToolScenario({
            expectedTool: 'setTrafficIncidentsMonitor',
            prompt,
            priorTurns: loadedIncidentsSeed,
        });
        expect(outcome.success, outcome.failureReason).toBe(true);
    });
});

// Loaded incidents + a monitor + a one-shot count analysis already attached (analysisId
// "incident-count::incidents-0"). This is the state monitorAnalysis operates on: an analysis exists,
// so a follow-up "keep it updated / stop tracking it" is a pure toggle on it.
const monitoredAnalysisSeed = () =>
    priorTurn(
        'Load the Amsterdam incidents, keep refreshing them, and count how many there are',
        [
            toolCall(
                'getTrafficIncidents',
                { where: { near: 'Amsterdam' } },
                {
                    count: 18,
                    entryId: 'incidents-0',
                    entries: [{ id: 'incidents-0', label: 'Amsterdam incidents', count: 18, timestamp: 0 }],
                },
            ),
            toolCall(
                'setTrafficIncidentsMonitor',
                { incidentsEntryID: 'incidents-0', enabled: true },
                { incidentsEntryID: 'incidents-0', enabled: true, alreadyInState: false },
            ),
            toolCall(
                'analyseData',
                {
                    incidentsEntryIDs: ['incidents-0'],
                    name: 'incident-count',
                    code: 'return { n: incidentsByEntry["incidents-0"].length };',
                },
                {
                    affectedEntries: [{ kind: 'incidents', id: 'incidents-0' }],
                    analysisId: 'incident-count::incidents-0',
                    name: 'incident-count',
                    outputFormat: 'json',
                    analysis: { n: 18 },
                },
            ),
        ],
        'Loaded 18 Amsterdam incidents, am refreshing them every 60 seconds, and counted them (18) — the count is ' +
            'attached as the "incident-count" analysis.',
    );

// monitorAnalysis is a pure on/off toggle over an EXISTING analysis (by analysisId from analyseData)
// — distinct from analyseData (defines/runs the computation once) and setTrafficIncidentsMonitor
// (polls the raw data, no analysis). With a count analysis already attached, "keep it updated" /
// "stop tracking it" route here.
describe.skipIf(!MODEL)('monitorAnalysis scenarios', { timeout: 180_000, retry: 3 }, () => {
    const [canonical, ...rest] = getExamplePrompts('monitorAnalysis');
    it(`classifies the canonical prompt: ${canonical}`, async () => {
        const outcome = await runToolScenario({
            expectedTool: 'monitorAnalysis',
            prompt: canonical,
            priorTurns: monitoredAnalysisSeed,
        });
        expect(outcome.success, outcome.failureReason).toBe(true);
    });
    it.skipIf(!FULL_SCENARIOS).each(rest)('handles registry examplePrompt: %s', async (prompt) => {
        const outcome = await runToolScenario({
            expectedTool: 'monitorAnalysis',
            prompt,
            priorTurns: monitoredAnalysisSeed,
        });
        expect(outcome.success, outcome.failureReason).toBe(true);
    });
});

// Cold path: loadedIncidentsSeed loads + monitors the raw entry but attaches NO analysis. A standing
// DERIVED metric — "a running breakdown by category, tell me when it shifts" — is a two-step flow:
// define it with analyseData, then make it recurring with monitorAnalysis (or analyseData's own
// `monitor` spec). Either tool is an acceptable route (the agent commonly creates first, monitors
// second). A plain refetch monitor (setTrafficIncidentsMonitor) does not produce the breakdown, and a
// bare count is already a top-level field of the entry — neither exercises this path, so the prompt
// asks for a computed aggregate that genuinely needs analyseData.
describe.skipIf(!MODEL)(
    'analyseData → monitorAnalysis (cold standing-analysis request)',
    { timeout: 180_000, retry: 3 },
    () => {
        it('routes a fresh standing "breakdown by category, tell me when it shifts" to create-or-monitor', async () => {
            const outcome = await runToolScenario({
                expectedTool: 'monitorAnalysis',
                acceptedAlternatives: ['analyseData'],
                prompt: 'Keep a running breakdown of the incidents by category and tell me when it shifts',
                priorTurns: loadedIncidentsSeed,
            });
            expect(outcome.success, outcome.failureReason).toBe(true);
        });
    },
);
