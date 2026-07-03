import { defineConfig } from 'vitest/config';

// Unit tests only — pure utilities under src. The app's vite.config (tailwind/react) is not loaded;
// component/e2e coverage lives in Playwright (test:e2e).
export default defineConfig({
    test: {
        include: ['src/**/*.test.ts'],
        environment: 'node',
    },
});
