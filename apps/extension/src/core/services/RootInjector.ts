// Interface of the root injector

export interface InjectOptions {
    overlay?: boolean;
}

export interface InjectedRoot {
    mountPoint: HTMLElement;
    destroy: () => void;
}

function createRootStyle(options?: InjectOptions) {
    return 'box-sizing: border-box; margin: 0; padding: 0; '
        + (options?.overlay
            ? 'position: fixed; inset: 0; isolation: isolate; pointer-events: none; z-index: 2147483647; '
            : 'position: relative; z-index: 0; '
        );
}

export interface RootInjector<T extends InjectedRoot = InjectedRoot> {
    /**
     * Injects or resolves a root element by id.
     * @param doc The document in which to find or create the root element.
     * @param rootId The id of the root element to find or create.
     * @param options Optional configuration for the injection process.
     * @returns The injected root descriptor containing the mount point.
     */
    inject: (doc: Document, rootId: string, options?: InjectOptions) => T;
}

// Document-based implementation of RootInjector

export class DocumentRootInjector implements RootInjector {
    /**
     * Resolves an existing root element by id, or creates and appends one to `document.body`.
     * @param doc The document in which to find or create the root element.
     * @param rootId The id of the root element to resolve or create.
     * @param options Optional configuration for the injection process.
     * @returns The injected root descriptor containing the mount point element.
     */
    inject(doc: Document, rootId: string, options?: InjectOptions): InjectedRoot {
        // create or reuse mount point
        let mountPoint = doc.getElementById(rootId) as HTMLElement | null;
        if (!mountPoint) {
            mountPoint = doc.createElement('div');
            mountPoint.id = rootId;
            mountPoint.style.cssText = createRootStyle(options);
            doc.body.appendChild(mountPoint);
        }
        return { mountPoint, destroy: () => mountPoint.remove()};
    }
}

// ShadowRoot-based implementation of RootInjector

export interface InjectedShadowRoot extends InjectedRoot {
    host: HTMLElement;
    shadowRoot: ShadowRoot;
}

function createShadowMountStyle(options?: InjectOptions) {
    return options?.overlay
        ? 'position: relative; width: 100%; height: 100%; pointer-events: none; '
        : '';
}

export class ShadowRootInjector implements RootInjector<InjectedShadowRoot> {
    /**
     * Resolves an existing shadow root host and mount point by id, or creates them.
     *
     * If an element with `rootId` exists and already has a shadow root containing
     * the internal mount node, that structure is reused. Otherwise, a new host,
     * shadow root, and mount node are created and appended to `document.body`.
     *
     * @param doc The document in which to find or create the shadow root host.
     * @param rootId The host element id used to find or create the shadow root container.
     * @param options Optional configuration for the injection process.
     * @returns The injected shadow root descriptor with `host`, `shadowRoot`, and `mountPoint`.
     */
    inject(doc: Document, rootId: string, options?: InjectOptions): InjectedShadowRoot {
        const mountId = `${rootId}-mount`;
        // create or reuse host
        let host = doc.getElementById(rootId) as HTMLElement | null;
        if (!host) {
            host = doc.createElement('div');
            host.id = rootId;
            host.style.cssText = createRootStyle(options);
            doc.body.appendChild(host);
        }
        // create or reuse shadow root
        const shadowRoot = host.shadowRoot ?? host.attachShadow({ mode: 'open' });
        // create or reuse mount point
        let mountPoint = shadowRoot.getElementById(mountId) as HTMLElement | null;
        if (!mountPoint) {
            mountPoint = doc.createElement('div');
            mountPoint.id = mountId;
            mountPoint.style.cssText = createShadowMountStyle(options);
            shadowRoot.appendChild(mountPoint);
        }
        return { host, shadowRoot, mountPoint, destroy: () => host.remove() };
    }

    /**
     * Applies the provided CSS text to the shadow root using an adopted stylesheet.
     *
     * @param root The injected shadow root descriptor whose shadow root receives the styles.
     * @param stylesText The CSS source to apply to the shadow root.
     */
    injectStyles(root: InjectedShadowRoot, stylesText: string): void {
        const sheet = new CSSStyleSheet();
        sheet.replaceSync(stylesText);

        root.shadowRoot.adoptedStyleSheets = [...root.shadowRoot.adoptedStyleSheets, sheet];
    }
}
