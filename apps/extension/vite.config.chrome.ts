import { defineConfig } from 'vite';
import preact from '@preact/preset-vite';
import { crx } from '@crxjs/vite-plugin';
import manifest from './src/chrome/manifest.config';

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
        outDir: '../../dist/chrome',
        emptyOutDir: true,
    },
});
