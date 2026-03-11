import path from 'node:path';
import react from '@vitejs/plugin-react';
import { defineConfig } from 'vite';

export default defineConfig({
    root: path.resolve(__dirname),
    plugins: [react()],
    build: {
        outDir: path.resolve(__dirname, 'dist'),
        emptyOutDir: true,
    },
    server: {
        host: '0.0.0.0',
        port: 4174,
    },
});
