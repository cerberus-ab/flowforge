import '@/chrome/sidePanel/panel.css';
import { mountInspectorSidePanel } from '@/chrome/sidePanel/mountInspectorSidePanel';
import { mountConstants } from '@/chrome/assistant/constants';

(function main() {
    mountInspectorSidePanel(mountConstants.SIDE_PANEL_ROOT_ID);
})();
