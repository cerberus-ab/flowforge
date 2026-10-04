import type { PageTrail } from '../../PageTrail.ts';
import { type MarkdownOptions, type ResolvedMarkdownOptions, resolveMarkdownOptions } from './options.ts';
import { renderMarkdown } from './render.ts';

/** Rendered semantic Markdown with character length and token count estimates. */
export class Markdown {
    constructor(
        private readonly content: string,
        private readonly resolvedOptions: ResolvedMarkdownOptions,
    ) {}

    /** Returns the rendered Markdown text. */
    toString(): string {
        return this.content;
    }

    /** Returns the Markdown length in UTF-16 code units. */
    get length(): number {
        return this.content.length;
    }

    /** Estimates tokens as one token per four UTF-8 bytes; actual counts depend on the model tokenizer. */
    estimatedTokenCount(): number {
        const byteLength = new TextEncoder().encode(this.content).length;
        return Math.ceil(byteLength / 4);
    }

    /**
     * Renders a PageTrail as semantic Markdown.
     *
     * Selected blocks are rendered in the supplied order. The detail level
     * controls how many structure, interaction, and content items are sampled.
     * By default, all blocks are included at the standard detail level.
     *
     * @param pageTrail - Collected page context to render.
     * @param options - Optional block selection and detail level.
     * @returns A Markdown value with rendered text, character length, and an estimated token count.
     */
    static from(pageTrail: PageTrail, options: MarkdownOptions = {}): Markdown {
        const resolvedOptions = resolveMarkdownOptions(options);
        const content = renderMarkdown(pageTrail, resolvedOptions);

        return new Markdown(content, resolvedOptions);
    }
}
