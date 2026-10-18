import '@/chrome/sidePanel/panel.css';
import { mountInspectorSidePanel } from '@/chrome/sidePanel/mountInspectorSidePanel';
import { mountConstants } from '@/chrome/inspector/constants';

(function main() {
    mountInspectorSidePanel(mountConstants.INSPECTOR_SIDE_PANEL_ROOT_ID);
})();
