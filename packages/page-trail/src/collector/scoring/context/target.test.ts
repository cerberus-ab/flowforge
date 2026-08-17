import { describe, expect, it } from 'vitest';

import { containerElement } from '../../../../test/fixtures';
import type { ContainerPathNode } from '../../../types';
import { scoreTargetContext } from './target';

function pathNode(distance: number, relevanceScore: number): ContainerPathNode {
    return {
        distance,
        element: containerElement({ dataId: `container-${distance}` }),
        relevanceScore: { value: relevanceScore },
    };
}

describe('scoreTargetContext', () => {
    it('returns zero context score for an empty path', () => {
        expect(scoreTargetContext({ path: [] })).toEqual({ value: 0 });
    });

    it('aggregates top-3 relevance scores with softened noisy-OR', () => {
        expect(
            scoreTargetContext({
                path: [pathNode(0, 0.9), pathNode(1, 0.8), pathNode(2, 0.7)],
            }),
        ).toEqual({ value: 1 - (1 - 0.9 ** 2) * (1 - 0.8 ** 2) * (1 - 0.7 ** 2) });
    });

    it('uses top-3 relevance scores by relevance rank, not path order', () => {
        expect(
            scoreTargetContext({
                path: [pathNode(0, 0.1), pathNode(1, 0.9), pathNode(2, 0.8), pathNode(3, 0.7)],
            }).value,
        ).toBeCloseTo(1 - (1 - 0.9 ** 2) * (1 - 0.8 ** 2) * (1 - 0.7 ** 2));
    });

    it('ignores path nodes after the top-3 relevance scores', () => {
        expect(
            scoreTargetContext({
                path: [pathNode(0, 0.9), pathNode(1, 0.8), pathNode(2, 0.7), pathNode(3, 0.6)],
            }).value,
        ).toBeCloseTo(1 - (1 - 0.9 ** 2) * (1 - 0.8 ** 2) * (1 - 0.7 ** 2));
    });

    it('does not penalize shorter non-empty paths for missing farther ancestors', () => {
        expect(
            scoreTargetContext({
                path: [pathNode(0, 0.8)],
            }).value,
        ).toBeCloseTo(0.8 ** 2);
    });

    it('returns one when any top context node has perfect relevance', () => {
        expect(
            scoreTargetContext({
                path: [pathNode(0, 1), pathNode(1, 0.2), pathNode(2, 0.1)],
            }).value,
        ).toBe(1);
    });
});
