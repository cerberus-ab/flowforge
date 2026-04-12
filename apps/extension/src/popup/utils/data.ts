import { constants } from '#self/constants';
import { normalizeText } from '#self/core/utils/text';

export interface PopupExampleItem {
    question: string;
    type: 'default' | 'previous';
}

/**
 * Build example questions by combining default and previous questions
 */
export function buildExampleItems(defaultQuestions: string[], previousQuestions: string[] = []): PopupExampleItem[] {
    const exSet = new Set<string>();
    const examples: PopupExampleItem[] = [];

    // previous first, then defaults
    const candidates = [
        ...previousQuestions.map((pq) => ({ question: pq, type: 'previous' as const })),
        ...defaultQuestions.map((dq) => ({ question: dq, type: 'default' as const })),
    ];

    for (const ex of candidates) {
        if (examples.length >= constants.EXAMPLES_MAX_ITEMS) break;

        const normalized = normalizeText(ex.question);
        const exKey = normalized.toLowerCase();

        if (!normalized || normalized.length > constants.EXAMPLES_MAX_QUESTION_LENGTH || exSet.has(exKey)) {
            continue;
        }

        examples.push({ question: normalized, type: ex.type });
        exSet.add(exKey);
    }

    return examples.sort(() => Math.random() - 0.5);
}
