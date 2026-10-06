import { configDefaults, defineConfig } from 'vitest/config';

// Unit tests only — pure utilities under src. The app's vite.config (tailwind/react) is not loaded;
// component/e2e coverage lives in Playwright (test:e2e). The agent scenarios call a real model, so
// they run only through vitest.scenarios.config.ts (test:agent-tool-calling), never here.
export default defineConfig({
    test: {
        include: ['src/**/*.test.ts'],
        exclude: [...configDefaults.exclude, 'src/tests/scenarios/**'],
        environment: 'node',
    },
});
