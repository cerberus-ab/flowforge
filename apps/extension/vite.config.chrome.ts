import { defineConfig } from 'vite';
import preact from '@preact/preset-vite';
import { crx } from '@crxjs/vite-plugin';
// @ts-expect-error an explicit extension for Vite import
import manifest from './src/chrome/manifest.config.ts';

export default defineConfig({
    root: 'src/chrome',
    resolve: {
        tsconfigPaths: true,
    },
    plugins: [
        crx({ manifest }),
        preact({
            include: [/action\/popup\/.*\.[tj]sx?$/, /contentScripts\/.*\.[tj]sx?$/],
        }),
    ],
    build: {
        target: 'esnext',
        sourcemap: true,
        modulePreload: false,
        outDir: '../../dist/chrome',
        emptyOutDir: true,
    },
});
