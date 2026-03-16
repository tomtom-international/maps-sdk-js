import { buildEvalPlaywrightConfig } from '@testing/ai-eval';
import { buildPlaywrightConfig } from '../playwright.config';

export default buildEvalPlaywrightConfig(buildPlaywrightConfig, {
    webServer: {
        ignoreHTTPSErrors: true,
        command: 'pnpm build:eval && pnpm start-test-server',
        port: 9051,
        reuseExistingServer: false,
    },
    reporter: [
        ['list'],
        ['@testing/ai-eval/reporter'],
        ['html', { open: 'never', outputFolder: 'e2e-tests/reports/html' }],
    ],
});
