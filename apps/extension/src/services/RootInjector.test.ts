import { describe, expect, it } from 'vitest';

import { DocumentRootInjector, ShadowRootInjector } from './RootInjector';

describe('DocumentRootInjector', () => {
    it('creates and reuses a document mount point', () => {
        const injector = new DocumentRootInjector();

        const first = injector.inject(document, 'flowforge-root');
        const second = injector.inject(document, 'flowforge-root');

        expect(first.mountPoint).toBe(second.mountPoint);
        expect(document.body.querySelectorAll('#flowforge-root')).toHaveLength(1);
    });

    it('destroys the injected mount point', () => {
        const injector = new DocumentRootInjector();

        const root = injector.inject(document, 'flowforge-root');
        root.destroy();

        expect(document.getElementById('flowforge-root')).toBeNull();
    });

    it('applies overlay root styles when requested', () => {
        const injector = new DocumentRootInjector();

        const root = injector.inject(document, 'flowforge-root', { overlay: true });

        expect(root.mountPoint.style.position).toBe('fixed');
        expect(root.mountPoint.style.pointerEvents).toBe('none');
    });
});

describe('ShadowRootInjector', () => {
    it('creates and reuses a shadow host and mount point', () => {
        const injector = new ShadowRootInjector();

        const first = injector.inject(document, 'flowforge-shadow-root');
        const second = injector.inject(document, 'flowforge-shadow-root');

        expect(first.host).toBe(second.host);
        expect(first.shadowRoot).toBe(second.shadowRoot);
        expect(first.mountPoint).toBe(second.mountPoint);
        expect(first.mountPoint.id).toBe('flowforge-shadow-root-mount');
    });

    it('destroys the shadow host', () => {
        const injector = new ShadowRootInjector();

        const root = injector.inject(document, 'flowforge-shadow-root');
        root.destroy();

        expect(document.getElementById('flowforge-shadow-root')).toBeNull();
    });

    it('injects adopted styles into the shadow root', () => {
        const injector = new ShadowRootInjector();
        const root = injector.inject(document, 'flowforge-shadow-root');

        injector.injectStyles(root, ':host { color: red; }');

        expect(root.shadowRoot.adoptedStyleSheets).toHaveLength(1);
    });
});
