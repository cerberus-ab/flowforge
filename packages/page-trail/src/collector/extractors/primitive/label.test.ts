import { describe, expect, it } from 'vitest';

import { getContainerElementLabels, getElementAttrAriaLabelledBy, getInteractiveElementLabels } from './label';

describe('getElementAttrAriaLabelledBy', () => {
    it('resolves referenced label text', () => {
        document.body.innerHTML = `
            <span id="first"> First </span>
            <span id="second"> second label </span>
            <button aria-labelledby="first second"></button>
        `;

        const button = document.querySelector('button')!;

        expect(getElementAttrAriaLabelledBy(button)).toBe('First second label');
    });

    it('limits resolved referenced label text', () => {
        document.body.innerHTML = `
            <span id="label">${'Long label text '.repeat(20)}</span>
            <button aria-labelledby="label"></button>
        `;

        const button = document.querySelector('button')!;
        const label = getElementAttrAriaLabelledBy(button);

        expect(label?.length).toBeLessThanOrEqual(120);
        expect(label).toBe(
            'Long label text Long label text Long label text Long label text Long label text Long label text Long label text Long',
        );
    });

    it('returns undefined when the attribute is missing', () => {
        expect(getElementAttrAriaLabelledBy(document.createElement('button'))).toBeUndefined();
    });
});

describe('getContainerLabels', () => {
    it('returns labels in priority order', () => {
        document.body.innerHTML = `
            <span id="label">Visible label</span>
            <section
                aria-labelledby="label"
                aria-label="Container label"
                title="Container title"
            >
                <legend>Legend label</legend>
                <h2>Heading label</h2>
            </section>
        `;

        const section = document.querySelector('section')!;

        expect(getContainerElementLabels(section)).toEqual([
            { value: 'Visible label', source: 'aria-labelledby' },
            { value: 'Container label', source: 'aria-label' },
            { value: 'Legend label', source: 'legend' },
            { value: 'Heading label', source: 'heading' },
            { value: 'Container title', source: 'title' },
        ]);
    });

    it('deduplicates values case-insensitively', () => {
        document.body.innerHTML = `
            <section aria-label="container label">
                <h2>Container label</h2>
            </section>
        `;

        expect(getContainerElementLabels(document.querySelector('section')!)).toEqual([
            { value: 'container label', source: 'aria-label' },
        ]);
    });

    it('returns an empty array when no labels are found', () => {
        expect(getContainerElementLabels(document.createElement('section'))).toEqual([]);
    });

    it('returns lower-level and ARIA headings as subheading labels', () => {
        document.body.innerHTML = `
            <section id="native">
                <h5>Native subheading</h5>
            </section>
            <section id="aria">
                <div role="heading">ARIA subheading</div>
            </section>
        `;

        expect(getContainerElementLabels(document.querySelector('#native')!)).toEqual([
            { value: 'Native subheading', source: 'subheading' },
        ]);
        expect(getContainerElementLabels(document.querySelector('#aria')!)).toEqual([
            { value: 'ARIA subheading', source: 'subheading' },
        ]);
    });
});

describe('getInteractiveElementLabels', () => {
    it('returns labels in priority order', () => {
        document.body.innerHTML = `
            <span id="label">Visible label</span>
            <label for="email">Email field</label>
            <input
                id="email"
                aria-labelledby="label"
                aria-label="Email"
                placeholder="name@example.com"
                title="Work email"
                name="email"
            />
        `;

        const input = document.querySelector('input')!;

        expect(getInteractiveElementLabels(input)).toEqual([
            { value: 'Visible label', source: 'aria-labelledby' },
            { value: 'Email', source: 'aria-label' },
            { value: 'Email field', source: 'label-for' },
            { value: 'name@example.com', source: 'placeholder' },
            { value: 'Work email', source: 'title' },
        ]);
    });

    it('extracts wrapper labels and deduplicates values case-insensitively', () => {
        document.body.innerHTML = `
            <label>
                Save
                <button aria-label="save" value="Save"></button>
            </label>
        `;

        const button = document.querySelector('button')!;

        expect(getInteractiveElementLabels(button)).toEqual([{ value: 'save', source: 'aria-label' }]);
    });

    it('returns an empty array when no labels are found', () => {
        expect(getInteractiveElementLabels(document.createElement('div'))).toEqual([]);
    });

    it('limits long interactive label values', () => {
        document.body.innerHTML = `
            <button aria-label="${'Long button label '.repeat(20)}"></button>
        `;

        const button = document.querySelector('button')!;
        const [label] = getInteractiveElementLabels(button);

        expect(label.source).toBe('aria-label');
        expect(label.value).toBe(
            'Long button label Long button label Long button label Long button label Long button label Long button label Long button',
        );
        expect(label.value.length).toBeLessThanOrEqual(120);
    });
});
