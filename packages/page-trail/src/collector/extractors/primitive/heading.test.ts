import { describe, expect, it } from 'vitest';

import { getContainerHeading } from './heading';

describe('getContainerHeading', () => {
    it('returns the first owned heading', () => {
        // Given
        document.body.innerHTML = `
            <section>
                <p>Intro</p>
                <h2 id="title">Primary heading</h2>
                <h3 id="subtitle">Secondary heading</h3>
            </section>
        `;

        // When
        const heading = getContainerHeading(document.querySelector('section')!);

        // Then
        expect(heading).toBe(document.querySelector('#title'));
    });

    it('returns heading wrapped by non-semantic markup', () => {
        // Given
        document.body.innerHTML = `
            <section>
                <div class="section-header">
                    <h2 id="title">Primary heading</h2>
                </div>
            </section>
        `;

        // When
        const heading = getContainerHeading(document.querySelector('section')!);

        // Then
        expect(heading).toBe(document.querySelector('#title'));
    });

    it('returns heading wrapped by a header element', () => {
        // Given
        document.body.innerHTML = `
            <section>
                <header>
                    <h2 id="title">Primary heading</h2>
                </header>
            </section>
        `;

        // When
        const heading = getContainerHeading(document.querySelector('section')!);

        // Then
        expect(heading).toBe(document.querySelector('#title'));
    });

    it('ignores headings from nested semantic containers', () => {
        // Given
        document.body.innerHTML = `
            <section>
                <section>
                    <h2 id="nested">Nested heading</h2>
                </section>
                <h2 id="title">Primary heading</h2>
            </section>
        `;

        // When
        const heading = getContainerHeading(document.querySelector('section')!);

        // Then
        expect(heading).toBe(document.querySelector('#title'));
    });

    it('returns undefined when only nested semantic containers have headings', () => {
        // Given
        document.body.innerHTML = `
            <section>
                <form>
                    <h2>Nested heading</h2>
                </form>
            </section>
        `;

        // When
        const heading = getContainerHeading(document.querySelector('section')!);

        // Then
        expect(heading).toBeUndefined();
    });

    it('supports ARIA heading role', () => {
        // Given
        document.body.innerHTML = `
            <section>
                <div id="title" role="heading">ARIA heading</div>
            </section>
        `;

        // When
        const heading = getContainerHeading(document.querySelector('section')!);

        // Then
        expect(heading).toBe(document.querySelector('#title'));
    });

    it('returns the first owned heading even when it is empty', () => {
        // Given
        document.body.innerHTML = `
            <section>
                <h2 id="empty"> </h2>
                <h3 id="title">Useful heading</h3>
            </section>
        `;

        // When
        const heading = getContainerHeading(document.querySelector('section')!);

        // Then
        expect(heading).toBe(document.querySelector('#empty'));
    });

    it('returns undefined when no heading exists', () => {
        // Given
        document.body.innerHTML = `<section><p>Content</p></section>`;

        // When
        const heading = getContainerHeading(document.querySelector('section')!);

        // Then
        expect(heading).toBeUndefined();
    });
});
