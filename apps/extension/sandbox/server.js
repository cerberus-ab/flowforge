import express from 'express';
import fs from 'fs';
import { dirname, join } from 'path';
import { marked } from 'marked';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

const app = express();
const PORT = getPort();

app.use('/assets', express.static(join(__dirname, './assets')));
app.use('/extension', express.static(join(__dirname, '../dist/embed')));

app.get('/', (_req, res) => {
    res.send(renderPage('index.html'));
});

app.get('/chrome', (_req, res) => {
    res.send(renderPage('chrome.html'));
});

app.get('/embed', (_req, res) => {
    res.send(renderPage('embed.html'));
});

app.get('/demo', (_req, res) => {
    res.send(renderPage('demo.html'));
});

function renderPage(pageName) {
    let html = fs.readFileSync(join(__dirname, 'pages', pageName), 'utf-8');

    if (html.includes('%SECTION_README%')) {
        const readme = fs.readFileSync(join(__dirname, '../README.md'), 'utf-8');
        html = html.replace('%SECTION_README%', marked.parse(readme));
    }
    if (html.includes('%FLOWFORGE_RUNTIME_JS%')) {
        html = html.replace('%FLOWFORGE_RUNTIME_JS%', getRuntimeFile());
    }
    return html;
}

function getRuntimeFile() {
    const manifestPath = join(__dirname, '../dist/embed/.vite/manifest.json');
    const manifest = JSON.parse(fs.readFileSync(manifestPath, 'utf-8'));

    return manifest['index.ts'].file;
}

app.listen(PORT, () => {
    console.log(`Sandbox running at http://localhost:${PORT}`);
});

function getPort() {
    const portFlag = process.argv.findIndex((arg) => arg === '--port' || arg === '-p');
    return portFlag === -1 ? 3007 : (process.argv[portFlag + 1] ?? 3007);
}
