import { describe, expect, it } from 'vitest';

import { getContainerHeading } from './heading';

describe('getContainerHeading', () => {
    it('returns the first owned heading', () => {
        document.body.innerHTML = `
            <section>
                <p>Intro</p>
                <h2 id="title">Primary heading</h2>
                <h3 id="subtitle">Secondary heading</h3>
            </section>
        `;

        expect(getContainerHeading(document.querySelector('section')!)).toBe(document.querySelector('#title'));
    });

    it('returns heading wrapped by non-semantic markup', () => {
        document.body.innerHTML = `
            <section>
                <div class="section-header">
                    <h2 id="title">Primary heading</h2>
                </div>
            </section>
        `;

        expect(getContainerHeading(document.querySelector('section')!)).toBe(document.querySelector('#title'));
    });

    it('returns heading wrapped by a header element', () => {
        document.body.innerHTML = `
            <section>
                <header>
                    <h2 id="title">Primary heading</h2>
                </header>
            </section>
        `;

        expect(getContainerHeading(document.querySelector('section')!)).toBe(document.querySelector('#title'));
    });

    it('ignores headings from nested semantic containers', () => {
        document.body.innerHTML = `
            <section>
                <section>
                    <h2 id="nested">Nested heading</h2>
                </section>
                <h2 id="title">Primary heading</h2>
            </section>
        `;

        expect(getContainerHeading(document.querySelector('section')!)).toBe(document.querySelector('#title'));
    });

    it('returns undefined when only nested semantic containers have headings', () => {
        document.body.innerHTML = `
            <section>
                <form>
                    <h2>Nested heading</h2>
                </form>
            </section>
        `;

        expect(getContainerHeading(document.querySelector('section')!)).toBeUndefined();
    });

    it('supports ARIA heading role', () => {
        document.body.innerHTML = `
            <section>
                <div id="title" role="heading">ARIA heading</div>
            </section>
        `;

        expect(getContainerHeading(document.querySelector('section')!)).toBe(document.querySelector('#title'));
    });

    it('returns the first owned heading even when it is empty', () => {
        document.body.innerHTML = `
            <section>
                <h2 id="empty"> </h2>
                <h3 id="title">Useful heading</h3>
            </section>
        `;

        expect(getContainerHeading(document.querySelector('section')!)).toBe(document.querySelector('#empty'));
    });

    it('returns undefined when no heading exists', () => {
        document.body.innerHTML = `<section><p>Content</p></section>`;

        expect(getContainerHeading(document.querySelector('section')!)).toBeUndefined();
    });
});
