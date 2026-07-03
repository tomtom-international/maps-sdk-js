import { test } from '@playwright/test';
import { createEvalAzure, loadConfig, makeJudgeAgent, rollUpUsage, runEvalSession } from 'agent-eval';
import { PROD_TEST_SERVER_PORT } from '../../playwright.config';
import { TAG_AGENT_EVAL } from '../../src/e2e-test-utils/e2eTestConstants';
import { retailExpansionManager } from './personas/personas';

const APP_URL = `http://localhost:${PROD_TEST_SERVER_PORT}/map-site-selection-agent-react/dist/prod`;

const { persona, tasks } = retailExpansionManager;
const task = tasks[0];

test(`${persona.name} — ${task.title}`, { tag: TAG_AGENT_EVAL }, async ({ page }) => {
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

    const usage = rollUpUsage(transcript, judgment);
    console.log(`[${task.title}] Token usage:`, JSON.stringify(usage, null, 2));
});
