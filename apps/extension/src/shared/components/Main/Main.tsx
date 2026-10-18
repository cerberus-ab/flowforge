import type { ComponentChildren } from 'preact';
import type { ExtensionSettingsTheme } from '@/services/SettingsStorage';

interface MainProps {
    theme?: ExtensionSettingsTheme;
    children: ComponentChildren;
}

export function Main({ theme = 'light', children }: MainProps) {
    return (
        <div className="flowforge-main" data-theme={theme}>
            {children}
        </div>
    );
}
