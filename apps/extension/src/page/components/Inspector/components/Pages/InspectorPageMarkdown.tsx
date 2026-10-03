import {
    type MarkdownOptionBlock,
    type MarkdownOptionDetailLevel,
    type PageTrail,
    Markdown,
} from '@flowforge/page-trail';
import { useMemo, useState } from 'preact/hooks';
import { InspectorPage } from './InspectorPage';
import { MarkdownViewer } from '@/shared/components/MarkdownViewer';
import { Select, type SelectOption } from '@/shared/components/Select';
import { Switch } from '@/shared/components/Switch';
import { Tooltip } from '@/shared/components/Tooltip';

const markdownDetailLevels: (SelectOption<MarkdownOptionDetailLevel> & { desc: string })[] = [
    { value: 'compact', label: 'Compact', desc: 'A short overview with the most important page details.' },
    {
        value: 'standard',
        label: 'Standard',
        desc: 'A balanced overview with more structure, interactions, and content.',
    },
    {
        value: 'full',
        label: 'Full',
        desc: 'All available page details, with content and interactions prioritized by importance.',
    },
];
const markdownBlocks: { value: MarkdownOptionBlock; label: string; desc: string }[] = [
    { value: 'basics', label: 'Basics', desc: 'The page title, URL, description, language, and current viewport.' },
    { value: 'structure', label: 'Structure', desc: 'An outline of the page landmarks, sections, forms, and dialogs.' },
    {
        value: 'interactive',
        label: 'Interactive',
        desc: 'Key buttons, links, inputs, and other controls, ordered by importance.',
    },
    {
        value: 'content',
        label: 'Content',
        desc: 'Meaningful content blocks from the page, ordered by importance.',
    },
];
const markdownDetailTooltip = markdownDetailLevels.map(({ label, desc }) => `${label}: ${desc}`).join('\n');

export function InspectorPageMarkdown({ pageTrail }: { pageTrail: PageTrail }) {
    const [detailLevel, setDetailLevel] = useState<MarkdownOptionDetailLevel>('standard');
    const [blocks, setBlocks] = useState<MarkdownOptionBlock[]>(() => markdownBlocks.map(({ value }) => value));
    const markdown = useMemo(
        () => Markdown.from(pageTrail, { detailLevel, blocks }).toString(),
        [pageTrail, detailLevel, blocks],
    );

    const setBlockEnabled = (block: MarkdownOptionBlock, enabled: boolean) => {
        setBlocks((current) =>
            markdownBlocks
                .map(({ value }) => value)
                .filter((item) => (item === block ? enabled : current.includes(item))),
        );
    };

    return (
        <InspectorPage padded={false} scroll={false}>
            <div className="flowforge-inspector-page-markdown">
                <aside className="flowforge-inspector-page-markdown__aside" aria-label="Markdown settings">
                    <h4 className="flowforge-inspector-page-markdown__title">Settings</h4>
                    <div className="flowforge-inspector-page-markdown__detail-select">
                        <label
                            id="flowforge-inspector-page-markdown-detail-level-label"
                            htmlFor="flowforge-markdown-page-detail"
                            className="flowforge-inspector-page-markdown__label"
                        >
                            Detail level
                        </label>
                        <Tooltip content={markdownDetailTooltip} side="right">
                            <Select
                                id="flowforge-markdown-page-detail"
                                aria-labelledby="flowforge-inspector-page-markdown-detail-level-label"
                                options={markdownDetailLevels}
                                variant="primary"
                                value={detailLevel}
                                onValueChange={setDetailLevel}
                            />
                        </Tooltip>
                    </div>
                    <fieldset className="flowforge-inspector-page-markdown__blocks">
                        <legend className="flowforge-inspector-page-markdown__label">Blocks</legend>
                        {markdownBlocks.map(({ value, label, desc }) => (
                            <Tooltip key={value} content={desc} side="right">
                                <Switch
                                    checked={blocks.includes(value)}
                                    wide
                                    variant="primary"
                                    label={label}
                                    onCheckedChange={(enabled) => setBlockEnabled(value, enabled)}
                                />
                            </Tooltip>
                        ))}
                    </fieldset>
                </aside>
                <div className="flowforge-inspector-page-markdown__content">
                    <MarkdownViewer value={markdown} />
                </div>
            </div>
        </InspectorPage>
    );
}
