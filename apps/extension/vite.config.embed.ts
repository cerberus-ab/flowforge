import { defineConfig } from 'vite';
import preact from '@preact/preset-vite';

export default defineConfig({
    root: 'src/embed',
    resolve: {
        tsconfigPaths: true,
    },
    plugins: [preact()],
    build: {
        target: 'esnext',
        sourcemap: true,
        outDir: '../../dist/embed',
        emptyOutDir: true,
        lib: {
            entry: 'index.ts',
            name: 'FlowForgeRuntime',
            formats: ['iife'],
        },
        rollupOptions: {
            output: {
                entryFileNames: 'flowforge-runtime.[hash].js',
            },
        },
        manifest: true
    },
});
