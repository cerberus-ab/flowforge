import fs from 'fs';
import path from 'path';

(async function installExtChrome() {
    const pkgPath = path.resolve(process.cwd(), 'package.json');
    const pkg = JSON.parse(fs.readFileSync(pkgPath, 'utf8'));

    const line = (content = '') => `│${content.padEnd(54)}│`;

    console.log(
        [
            '╭──────────────────────────────────────────────────────╮',
            line(),
            line(`   FlowForge - assistant ${pkg.version}`),
            line('    ───'),
            line('   How to install Assistant (Chrome):'),
            line('    1. Open: chrome://extensions/'),
            line('    2. Enable "Developer mode"'),
            line('    3. Click "Load unpacked"'),
            line('    4. Select: "apps/extension/dist/chrome/assistant"'),
            line(),
            '╰──────────────────────────────────────────────────────╯',
        ].join('\n'),
    );
})();
