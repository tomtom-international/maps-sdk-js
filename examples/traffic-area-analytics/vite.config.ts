import { defineConfig, mergeConfig } from 'vite';
import baseConfigFn from '../example-vite.config';

// Extends the shared example config with a CORS proxy for the area analytics API.
export default defineConfig(({ mode, command }) => {
    const base = typeof baseConfigFn === 'function' ? baseConfigFn({ mode, command }) : baseConfigFn;
    return mergeConfig(base, {
        server: {
            proxy: {
                '/areaanalytics': {
                    target: 'https://api.tomtom.com',
                    changeOrigin: true,
                },
            },
        },
    });
});
