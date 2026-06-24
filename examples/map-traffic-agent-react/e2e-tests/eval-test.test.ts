import { expect, test } from '@playwright/test';
import {
    createEvalAzure,
    evalDeploymentId,
    makeJudgeAgent,
    makeUserAgent,
    type Persona,
    PlaywrightAgentAdapter,
    Runner,
} from 'agent-eval';
import { PROD_TEST_SERVER_PORT } from '../../playwright.config';

test('retail expansion manager eval @agent-eval', async ({ page }) => {
    test.setTimeout(180_000);

    const persona: Persona = {
        name: 'Retail Expansion Manager',
        description: 'I am a retail manager with 15 years of experience. I am only interested in office spaces.',
        task: {
            description: 'find me office spaces in Amsterdam',
        },
    };

    const model = createEvalAzure().chat(evalDeploymentId);
    const user = makeUserAgent(persona, model);

    const agent = new PlaywrightAgentAdapter(
        page,
        `http://localhost:${PROD_TEST_SERVER_PORT}/map-traffic-agent-react/dist/prod`,
    );

    const runner = new Runner(user, agent);

    const transcript = await runner.run();

    console.log('Transcript:', JSON.stringify(transcript, null, 2));

    // Turn 0 is the dataset-fed user query; turn 1 the agent's response.
    expect(transcript.turns.length).toBeGreaterThan(1);
    expect(transcript.turns[1].output).toBeDefined();

    const judge = makeJudgeAgent(model);
    const judgment = await judge.act(transcript);

    console.log('Judgment:', judgment);

    expect(judgment.score).toBeGreaterThanOrEqual(0);
    expect(judgment.score).toBeLessThanOrEqual(100);
});
