import { describe, expect, it, vi } from 'vitest';

import { containerElement } from '../../../test/fixtures';
import type { ContainerElement } from '../../types';
import type { ContainerTree } from './ContainerTree';
import { extractContentElementContext, extractInteractiveElementContext } from './context';

describe('context extractors', () => {
    it('extracts content context from the content target path', () => {
        // Given
        const el = document.createElement('p');
        const containers: ContainerElement[] = [
            containerElement({ id: 0, role: 'section' }),
            containerElement({ id: 1, role: 'main content', type: 'landmark' }),
        ];
        const containerTree = {
            getPathToRoot: vi.fn().mockReturnValue(containers),
        } as unknown as ContainerTree;

        // When
        const context = extractContentElementContext(containerTree, el, { type: 'text' });

        // Then
        expect(containerTree.getPathToRoot).toHaveBeenCalledWith(el);
        expect(context.path.map((node) => node.container)).toEqual(containers);
        expect(context.path.map((node) => node.distance)).toEqual([0, 1]);
        expect(context.path.every((node) => node.relevanceScore.value >= 0)).toBe(true);
        expect(context.contextScore.value).toBeGreaterThan(0);
    });

    it('extracts interactive context from the interactive target path', () => {
        // Given
        const el = document.createElement('button');
        const containers: ContainerElement[] = [
            containerElement({ id: 0, role: 'form', type: 'form' }),
            containerElement({ id: 1, role: 'main content', type: 'landmark' }),
        ];
        const containerTree = {
            getPathToRoot: vi.fn().mockReturnValue(containers),
        } as unknown as ContainerTree;

        // When
        const context = extractInteractiveElementContext(containerTree, el, { role: 'button', type: 'button' });

        // Then
        expect(containerTree.getPathToRoot).toHaveBeenCalledWith(el);
        expect(context.path.map((node) => node.container)).toEqual(containers);
        expect(context.path.map((node) => node.distance)).toEqual([0, 1]);
        expect(context.path.every((node) => node.relevanceScore.value >= 0)).toBe(true);
        expect(context.contextScore.value).toBeGreaterThan(0);
    });
});
