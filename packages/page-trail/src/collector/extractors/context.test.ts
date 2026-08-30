import { describe, expect, it, vi } from 'vitest';

import { containerElement } from '../../../test/fixtures';
import type { ContainerPathNode } from '../../types';
import type { ContainerTree } from './ContainerTree';
import { extractContentElementContext, extractInteractiveElementContext } from './context';

function pathNode(distance: number, relevanceScore: number): ContainerPathNode {
    return {
        distance,
        element: containerElement({ dataId: `container-${distance}` }),
        relevanceScore: { value: relevanceScore },
    };
}

describe('context extractors', () => {
    it('extracts content context from the content target path', () => {
        // Given
        const el = document.createElement('p');
        const path = [pathNode(0, 0.1), pathNode(1, 0.9), pathNode(2, 0.8), pathNode(3, 0.7)];
        const containerTree = {
            getContentTargetPath: vi.fn().mockReturnValue(path),
        } as unknown as ContainerTree;

        // When
        const context = extractContentElementContext(containerTree, el, { type: 'text' });

        // Then
        expect(containerTree.getContentTargetPath).toHaveBeenCalledWith(el, { type: 'text' });
        expect(context).toEqual({
            path,
            breadcrumbs: [3, 2, 1],
            contextScore: { value: 1 - (1 - 0.9 ** 2) * (1 - 0.8 ** 2) * (1 - 0.7 ** 2) },
        });
    });

    it('extracts interactive context from the interactive target path', () => {
        // Given
        const el = document.createElement('button');
        const path = [pathNode(0, 0.6), pathNode(1, 0.5)];
        const containerTree = {
            getInteractiveTargetPath: vi.fn().mockReturnValue(path),
        } as unknown as ContainerTree;

        // When
        const context = extractInteractiveElementContext(containerTree, el, { role: 'button', type: 'button' });

        // Then
        expect(containerTree.getInteractiveTargetPath).toHaveBeenCalledWith(el, { role: 'button', type: 'button' });
        expect(context).toEqual({
            path,
            breadcrumbs: [1, 0],
            contextScore: { value: 1 - (1 - 0.6 ** 2) * (1 - 0.5 ** 2) },
        });
    });
});
