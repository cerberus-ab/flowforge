import type { ComponentChildren } from 'preact';
import type { ExtensionSettingsTheme } from '#self/types';

interface MainProps {
    theme: ExtensionSettingsTheme;
    children: ComponentChildren;
}

export function Main({ theme, children }: MainProps) {
    return (
        <div className={`flowforge-main`} data-theme={theme}>
            {children}
        </div>
    );
}
