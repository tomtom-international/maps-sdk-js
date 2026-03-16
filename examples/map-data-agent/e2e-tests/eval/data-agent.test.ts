// examples/map-data-agent/e2e-tests/eval/data-agent.test.ts
import { runEvalSuite } from '@testing/ai-eval';
import { cases } from './eval-cases';

runEvalSuite(cases, { baseUrl: '/map-data-agent/dist' });
