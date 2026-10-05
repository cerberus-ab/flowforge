import { mkdir } from 'node:fs/promises';
import { dirname, relative, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';

import sharp from 'sharp';

const extensionRoot = resolve(dirname(fileURLToPath(import.meta.url)), '..');
const sizes = [16, 32, 48, 128];

const icons = {
    assistant: {
        source: 'src/chrome/assistant/action/icon.svg',
        output: 'src/chrome/assistant/action/icon-{size}.png',
    },
    inspector: {
        source: 'src/chrome/inspector/action/icon-inspector.svg',
        output: 'src/chrome/inspector/action/icon-inspector-{size}.png',
    },
};

async function generateIconSet({ source, output }) {
    const sourcePath = resolve(extensionRoot, source);

    await Promise.all(
        sizes.map(async (size) => {
            const outputPath = resolve(extensionRoot, output.replace('{size}', String(size)));
            await renderIcon(sourcePath, outputPath, size);
        }),
    );
}

async function renderIcon(sourcePath, outputPath, size) {
    await mkdir(dirname(outputPath), { recursive: true });
    await sharp(sourcePath)
        .resize({
            width: size,
            height: size,
            fit: 'contain',
            background: { r: 0, g: 0, b: 0, alpha: 0 },
        })
        .png({ compressionLevel: 9 })
        .toFile(outputPath);

    console.log(`Generated ${relative(extensionRoot, outputPath)}`);
}

// main
(async function main() {
    const target = process.argv.find((argument) => argument.startsWith('--for='))?.slice('--for='.length);
    const icon = icons[target];

    if (!icon) {
        console.error('Usage: node scripts/generate-icons.js --for=assistant|inspector');
        process.exitCode = 1;
    } else {
        await generateIconSet(icon);
    }
})();
