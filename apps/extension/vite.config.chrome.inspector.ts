import { defineConfig } from 'vite';
import { crx } from '@crxjs/vite-plugin';
// @ts-expect-error an explicit extension for Vite import
import manifest from './src/chrome/inspector/manifest.config.ts';

export default defineConfig({
    root: 'src/chrome/inspector',
    resolve: {
        tsconfigPaths: true,
    },
    plugins: [crx({ manifest })],
    build: {
        target: 'esnext',
        sourcemap: true,
        modulePreload: false,
        outDir: '../../../dist/chrome/inspector',
        emptyOutDir: true,
    },
});
