import tailwindcss from '@tailwindcss/vite';
import { defineConfig, type UserConfig, type UserConfigFnObject } from 'vite';
import sharedConfig from '../example-vite.config.ts';

// Reuse the shared example Vite config and prepend the Tailwind v4 plugin so its `enforce: 'pre'`
// hooks see CSS first. (`@tailwindcss/vite` returns an array of three pre-enforced sub-plugins —
// scan + generate-serve + generate-build — and Vite groups by `enforce` regardless of array
// order, but prepending makes intent obvious and avoids surprises if a future plugin in the
// shared config decides to claim CSS itself.)
export default defineConfig(async (env) => {
    const resolved =
        typeof sharedConfig === 'function'
            ? await (sharedConfig as UserConfigFnObject)(env as Parameters<UserConfigFnObject>[0])
            : (sharedConfig as UserConfig);
    return {
        ...resolved,
        plugins: [...tailwindcss(), ...(resolved.plugins ?? [])],
    };
});
