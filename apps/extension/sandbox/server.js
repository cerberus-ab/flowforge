import express from 'express';
import fs from 'fs';
import { dirname, join } from 'path';
import { marked } from 'marked';
import { fileURLToPath } from 'url';

import embedManifest from '../dist/embed/.vite/manifest.json' with { type: 'json' };

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

const app = express();
const PORT = process.env.PORT || 3007;

app.use('/assets', express.static(join(__dirname, './assets')));
app.use('/extension', express.static(join(__dirname, '../dist/embed')));

app.get('/', (_req, res) => {
    try {
        const readme = fs.readFileSync(join(__dirname, '../README.md'), 'utf-8');
        let html = fs.readFileSync(join(__dirname, 'index.html'), 'utf-8');

        html = html.replace('%SECTION_README%', marked.parse(readme));
        html = html.replace('%FLOWFORGE_RUNTIME_JS%', embedManifest['index.ts'].file);

        res.send(html);
    } catch (error) {
        console.error(error);
        res.status(500).send('Error rendering sandbox');
    }
});

app.listen(PORT, () => {
    console.log(`Sandbox running at http://localhost:${PORT}`);
});
