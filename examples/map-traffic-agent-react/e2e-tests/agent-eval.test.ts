import { test } from '@playwright/test';
import { createEvalAzure, loadConfig, makeJudgeAgent, rollUpUsage, runEvalSession } from 'agent-eval';
import { PROD_TEST_SERVER_PORT } from '../../playwright.config';
import { evalPersonas } from './eval-personas';

// Entrypoint for running any agent through the eval. This drives the live pipeline per persona/task —
// simulated user ↔ agent under test → judge → token rollup — and logs the result. It deliberately makes
// NO assertions: framework correctness (transcript shape, judgment, token rollup) is covered by the unit
// tests in agent-eval/src/tests. A run "passes" if the whole pipeline executes without throwing.
const APP_URL = `http://localhost:${PROD_TEST_SERVER_PORT}/map-traffic-agent-react/dist/prod`;

// CI runtime cap: each run drives a full multi-turn conversation + judge (up to 180s), so the whole
// persona×task suite (54 runs) would take hours. Run a small representative slice for now — one task from
// the first few personas — and widen when we want broader live coverage. The full suite lives in
// eval-personas.ts and remains the calibration reference; the frozen corpus (not this) is the source of truth.
const MAX_EVAL_RUNS = 2;
const evalRuns = evalPersonas.slice(0, MAX_EVAL_RUNS).map(({ persona, tasks }) => ({ persona, task: tasks[0] }));

for (const { persona, task } of evalRuns) {
    test(`${persona.name} — ${task.title} @agenteval`, async ({ page }) => {
        test.setTimeout(180_000);

        // Separate deployments per role so Azure tracks user-agent vs judge token usage apart.
        const config = loadConfig();
        const azure = createEvalAzure(config);
        const userModel = azure.chat(config.userAgentDeploymentId);
        const judgeModel = azure.chat(config.judgeDeploymentId);

        const transcript = await runEvalSession({
            page,
            url: APP_URL,
            persona,
            task: { description: task.description },
            model: userModel,
        });
        console.log(`[${task.title}] Transcript:`, JSON.stringify(transcript, null, 2));

        const judge = makeJudgeAgent(judgeModel, persona.goal);
        const judgment = await judge.act(transcript);
        console.log(`[${task.title}] Judgment:`, JSON.stringify(judgment, null, 2));

        // Per-test token cost, split by agent (user / agent-under-test / judge) plus the grand total.
        const usage = rollUpUsage(transcript, judgment);
        console.log(`[${task.title}] Token usage:`, JSON.stringify(usage, null, 2));
    });
}
