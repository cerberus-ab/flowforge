import { defineManifest } from '@crxjs/vite-plugin';
import pkg from '../../../package.json' with { type: 'json' };

export default defineManifest({
    manifest_version: 3,
    name: 'FlowForge — Page Inspector',
    version: pkg.version,
    description:
        'Page Inspector helps you explore the structure, content, and interactive elements of the current web page.',
    permissions: ['activeTab', 'scripting'],
    action: {
        default_popup: 'action/popup/index.html',
        default_icon: 'action/icon-inspector.png',
    },
    icons: {
        128: 'action/icon-inspector.png',
    },
});
