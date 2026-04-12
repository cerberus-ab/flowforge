import fs from 'fs';
import path from 'path';

(async function installExtChrome() {
    const pkgPath = path.resolve(process.cwd(), 'package.json');
    const pkg = JSON.parse(fs.readFileSync(pkgPath, 'utf8'));

    console.log(`╭──────────────────────────────────────────────────────╮
│                                                      │
│   FlowForge - Browser Extension v${pkg.version}               │
│    ───                                               │
│   How to install the extension (Chrome):             │
│    1. Open: chrome://extensions/                     │
│    2. Enable "Developer mode"                        │
│    3. Click "Load unpacked"                          │
│    4. Select: "apps/extension/dist/chrome" folder    │
│                                                      │
╰──────────────────────────────────────────────────────╯`);
})();
