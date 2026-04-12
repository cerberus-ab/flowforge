import { defineManifest } from '@crxjs/vite-plugin';
import pkg from '../../package.json';

export default defineManifest({
    manifest_version: 3,
    name: 'FlowForge',
    version: pkg.version,
    description: 'AI-powered assistant helps to learn and navigate web applications using natural language.',
    permissions: ['activeTab', 'storage', 'scripting'],
    host_permissions: ['<all_urls>'],
    background: {
        service_worker: 'background/worker.ts',
        type: 'module',
    },
    content_scripts: [
        {
            matches: ['<all_urls>'],
            js: ['contentScripts/page.tsx'],
            run_at: 'document_idle',
        },
    ],
    web_accessible_resources: [
        {
            resources: [],
            matches: ['<all_urls>'],
        },
    ],
    action: {
        default_popup: 'action/popup/index.html',
        default_icon: 'action/icon.png',
    },
    icons: {
        128: 'action/icon.png',
    },
});
