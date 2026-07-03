import tailwindcss from '@tailwindcss/vite';
import { defineConfig, type UserConfig, type UserConfigFnObject } from 'vite';
import sharedConfig from '../example-vite.config';

// Reuse the shared example Vite config and prepend the Tailwind v4 plugin so its `enforce: 'pre'`
// hooks see CSS first.
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
