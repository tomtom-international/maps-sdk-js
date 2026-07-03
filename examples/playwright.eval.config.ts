import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { buildPlaywrightConfig, PROD_TEST_SERVER_PORT } from './playwright.config';

if (!process.env.CI) {
    const configDir = path.dirname(fileURLToPath(import.meta.url));
    process.loadEnvFile(path.resolve(configDir, '.env'));
}

export default buildPlaywrightConfig({
    retries: 2,
    webServer: [
        {
            command: 'pnpm start-test-server:prod',
            port: PROD_TEST_SERVER_PORT,
            reuseExistingServer: true,
            ignoreHTTPSErrors: true,
        },
    ],
});
