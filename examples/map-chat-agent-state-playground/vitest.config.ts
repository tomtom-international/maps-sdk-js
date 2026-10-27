import { defineConfig } from 'vitest/config';

// Unit tests only — pure utilities under src, in node. The app's vite.config (tailwind/react) is not loaded.
export default defineConfig({
    test: {
        include: ['src/**/*.test.ts'],
        environment: 'node',
    },
});
