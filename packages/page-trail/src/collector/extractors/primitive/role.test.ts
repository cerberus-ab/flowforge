import { describe, expect, it } from 'vitest';

import { getContainerRole, getInteractiveRole, roleToContainerElementType, roleToInteractiveElementType } from './role';

describe('getContainerRole', () => {
    it('resolves native container roles', () => {
        expect(roleOfContainer('<main></main>')).toBe('main content');
        expect(roleOfContainer('<nav></nav>')).toBe('navigation');
        expect(roleOfContainer('<aside></aside>')).toBe('sidebar');
    });

    it('resolves aria container roles', () => {
        expect(roleOfContainer('<div role="banner"></div>')).toBe('header');
        expect(roleOfContainer('<div role="alertdialog"></div>')).toBe('alert dialog');
        expect(roleOfContainer('<div role="dialog" aria-modal="true"></div>')).toBe('modal dialog');
    });

    it('returns undefined for unsupported elements', () => {
        expect(roleOfContainer('<span></span>')).toBeUndefined();
    });
});

describe('roleToContainerElementType', () => {
    it('maps container roles to element types', () => {
        expect(roleToContainerElementType('modal dialog')).toBe('dialog');
        expect(roleToContainerElementType('main content')).toBe('landmark');
        expect(roleToContainerElementType('navigation')).toBe('navigation');
        expect(roleToContainerElementType('form')).toBe('form');
        expect(roleToContainerElementType('article')).toBe('section');
        expect(roleToContainerElementType('toolbar')).toBe('widget');
        expect(roleToContainerElementType('table row')).toBe('table');
    });
});

describe('getInteractiveRole', () => {
    it('resolves native interactive roles', () => {
        expect(roleOfInteractive('<button></button>')).toBe('button');
        expect(roleOfInteractive('<a href="/docs"></a>')).toBe('link');
        expect(roleOfInteractive('<textarea></textarea>')).toBe('textbox');
    });

    it('resolves input roles by type', () => {
        expect(roleOfInteractive('<input type="checkbox" />')).toBe('checkbox');
        expect(roleOfInteractive('<input type="radio" />')).toBe('radio');
        expect(roleOfInteractive('<input type="range" />')).toBe('slider');
        expect(roleOfInteractive('<input type="search" />')).toBe('searchbox');
        expect(roleOfInteractive('<input type="hidden" />')).toBeUndefined();
    });

    it('resolves select roles by shape', () => {
        expect(roleOfInteractive('<select></select>')).toBe('combobox');
        expect(roleOfInteractive('<select multiple></select>')).toBe('listbox');
        expect(roleOfInteractive('<select size="2"></select>')).toBe('listbox');
    });
});

describe('roleToInteractiveElementType', () => {
    it('maps roles to element types', () => {
        expect(roleToInteractiveElementType('button')).toBe('button');
        expect(roleToInteractiveElementType('link')).toBe('link');
        expect(roleToInteractiveElementType('textbox')).toBe('input');
        expect(roleToInteractiveElementType('checkbox')).toBe('select');
    });
});

function roleOfContainer(html: string) {
    document.body.innerHTML = html;

    return getContainerRole(document.body.firstElementChild!);
}

function roleOfInteractive(html: string) {
    document.body.innerHTML = html;

    return getInteractiveRole(document.body.firstElementChild!);
}
