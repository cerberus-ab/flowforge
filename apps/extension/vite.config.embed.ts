import { defineConfig } from 'vite';
import preact from '@preact/preset-vite';

export default defineConfig(({ mode }) => ({
    root: 'src/embed',
    resolve: {
        tsconfigPaths: true,
    },
    plugins: [preact()],
    build: {
        target: 'esnext',
        sourcemap: mode !== 'production',
        outDir: '../../dist/embed',
        emptyOutDir: true,
        manifest: true,
        assetsInlineLimit: Number.MAX_SAFE_INTEGER,
        rollupOptions: {
            input: {
                loader: 'index.ts',
            },
            output: {
                entryFileNames: 'flowforge-loader.[hash].js',
                chunkFileNames: 'flowforge-runtime.[hash].js',
            },
        },
    },
}));
