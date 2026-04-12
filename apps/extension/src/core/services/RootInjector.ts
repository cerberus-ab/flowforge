export interface InjectOptions {
    overlay?: boolean;
}

export interface InjectedRoot {
    mountPoint: HTMLElement;
}

export interface RootInjector {
    /**
     * Injects or resolves a root element by id.
     * @param rootId The id of the root element to find or create.
     * @param options Optional configuration for the injection process.
     * @returns The injected root descriptor containing the mount point.
     */
    inject: (rootId: string, options?: InjectOptions) => InjectedRoot;
}

export class DocumentRootInjector implements RootInjector {
    /**
     * Resolves an existing root element by id, or creates and appends one to `document.body`.
     * @param rootId The id of the root element to resolve or create.
     * @param options Optional configuration for the injection process.
     * @returns The injected root descriptor containing the mount point element.
     */
    inject(rootId: string, options?: InjectOptions): InjectedRoot {
        const existing = document.getElementById(rootId);
        if (existing) return { mountPoint: existing };

        const root = document.createElement('div');
        root.id = rootId;
        root.style.cssText = `${
            options?.overlay
                ? `
            position: fixed;
            inset: 0;
            pointer-events: none;
            z-index: 2147483647;`
                : ''
        }`;
        document.body.appendChild(root);

        return { mountPoint: root };
    }
}

export interface InjectedShadowRoot extends InjectedRoot {
    host: HTMLElement;
    shadowRoot: ShadowRoot;
}

export class ShadowRootInjector implements RootInjector {
    /**
     * Resolves an existing shadow root host and mount point by id, or creates them.
     *
     * If an element with `rootId` exists and already has a shadow root containing
     * the internal mount node, that structure is reused. Otherwise, a new host,
     * shadow root, and mount node are created and appended to `document.body`.
     *
     * @param rootId The host element id used to find or create the shadow root container.
     * @param options Optional configuration for the injection process.
     * @returns The injected shadow root descriptor with `host`, `shadowRoot`, and `mountPoint`.
     */
    inject(rootId: string, options?: InjectOptions): InjectedShadowRoot {
        const mountId = 'mount';
        const existingHost = document.getElementById(rootId);

        if (existingHost?.shadowRoot) {
            const existingMount = existingHost.shadowRoot.getElementById(mountId);
            if (existingMount) {
                return {
                    host: existingHost,
                    shadowRoot: existingHost.shadowRoot,
                    mountPoint: existingMount,
                };
            }
        }

        const host = document.createElement('div');
        host.id = rootId;
        host.style.cssText = `
            all: initial;
            ${
                options?.overlay
                    ? `
            position: fixed;
            inset: 0;
            pointer-events: none;
            z-index: 2147483647;`
                    : ''
            }`;
        const shadowRoot = host.attachShadow({ mode: 'open' });
        const mountPoint = document.createElement('div');
        mountPoint.id = mountId;
        mountPoint.style.cssText = `${
            options?.overlay
                ? `
            position: relative;
            width: 100%;
            height: 100%;
            pointer-events: none;`
                : ''
        }`;
        shadowRoot.appendChild(mountPoint);
        document.body.appendChild(host);

        return { host, shadowRoot, mountPoint };
    }

    /**
     * Applies the provided CSS text to the shadow root using an adopted stylesheet.
     *
     * @param root The injected shadow root descriptor whose shadow root receives the styles.
     * @param stylesText The CSS source to apply to the shadow root.
     */
    injectStyles(root: InjectedShadowRoot, stylesText: string) {
        const sheet = new CSSStyleSheet();
        sheet.replaceSync(stylesText);

        root.shadowRoot.adoptedStyleSheets = [sheet];
    }
}
