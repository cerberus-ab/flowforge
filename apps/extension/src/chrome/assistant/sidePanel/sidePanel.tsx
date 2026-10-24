import '@/sidePanel/sidePanel.css';

import { mountConstants } from '@/chrome/assistant/constants';
import { mountSidePanel } from '@/sidePanel/mountSidePanel';

(function main() {
    mountSidePanel(mountConstants.SIDE_PANEL_ROOT_ID);
})();
