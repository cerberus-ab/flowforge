import { defineManifest } from '@crxjs/vite-plugin';
import pkg from '../../../package.json' with { type: 'json' };

export default defineManifest({
    manifest_version: 3,
    name: 'FlowForge — Page Inspector',
    version: pkg.version,
    description:
        'Page Inspector helps to explore the structure, content, and interactive elements of the current web page.',
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
            run_at: 'document_end',
        },
    ],
    action: {
        default_popup: 'action/popup/index.html',
        default_icon: {
            16: 'action/icon-inspector-16.png',
            32: 'action/icon-inspector-32.png',
            48: 'action/icon-inspector-48.png',
            128: 'action/icon-inspector-128.png',
        },
    },
    icons: {
        16: 'action/icon-inspector-16.png',
        32: 'action/icon-inspector-32.png',
        48: 'action/icon-inspector-48.png',
        128: 'action/icon-inspector-128.png',
    },
});
