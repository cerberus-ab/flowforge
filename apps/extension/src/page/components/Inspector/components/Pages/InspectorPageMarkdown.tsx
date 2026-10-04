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
import { cx } from '@/shared/utils/cx';

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
    const markdown = useMemo(() => Markdown.from(pageTrail, { detailLevel, blocks }), [pageTrail, detailLevel, blocks]);
    const pageSizes = [
        { id: 'html', label: 'HTML', value: pageTrail.metadata.outerHtmlLength },
        { id: 'text', label: 'Visible text', value: pageTrail.metadata.innerTextLength },
        { id: 'markdown', label: 'Markdown', value: markdown.length },
        { id: 'tokens', label: 'Estimated tokens', value: markdown.estimatedTokenCount() },
    ];
    const largestPageSize = Math.max(...pageSizes.filter(({ id }) => id !== 'tokens').map(({ value }) => value), 1);

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
                <aside className="flowforge-inspector-page-markdown__aside" aria-label="Markdown settings and stats">
                    <div className="flowforge-inspector-page-markdown__section">
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
                                    data-testid="flowforge-markdown-detail-level"
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
                            <div className="flowforge-inspector-page-markdown__block-list">
                                {markdownBlocks.map(({ value, label, desc }) => (
                                    <Tooltip key={value} content={desc} side="right">
                                        <Switch
                                            checked={blocks.includes(value)}
                                            data-testid={`flowforge-markdown-block-${value}`}
                                            wide
                                            variant="primary"
                                            label={label}
                                            onCheckedChange={(enabled) => setBlockEnabled(value, enabled)}
                                        />
                                    </Tooltip>
                                ))}
                            </div>
                        </fieldset>
                    </div>
                    <div className="flowforge-inspector-page-markdown__section">
                        <h4 className="flowforge-inspector-page-markdown__title">Stats</h4>
                        <div className="flowforge-inspector-page-markdown__sizes">
                            <span className="flowforge-inspector-page-markdown__label">Size by characters</span>
                            <div className="flowforge-inspector-page-markdown__size-list">
                                {pageSizes.map(({ id, label, value }) => (
                                    <div
                                        key={id}
                                        className="flowforge-inspector-page-markdown__size"
                                        data-testid={`flowforge-markdown-stat-${id}`}
                                    >
                                        <div className="flowforge-inspector-page-markdown__size-label">
                                            <span>{label}</span>
                                            <span>{id === 'tokens' ? `~${value}` : value}</span>
                                        </div>
                                        <div
                                            className={cx(
                                                'flowforge-inspector-page-markdown__size-track',
                                                id === 'tokens' &&
                                                    'flowforge-inspector-page-markdown__size-track--transparent',
                                            )}
                                            aria-hidden="true"
                                        >
                                            <span
                                                className={cx(
                                                    'flowforge-inspector-page-markdown__size-fill',
                                                    id === 'markdown' &&
                                                        'flowforge-inspector-page-markdown__size-fill--primary',
                                                    id === 'tokens' &&
                                                        'flowforge-inspector-page-markdown__size-fill--transparent',
                                                )}
                                                style={{
                                                    width: `${(value / largestPageSize) * 100}%`,
                                                }}
                                            />
                                        </div>
                                    </div>
                                ))}
                            </div>
                        </div>
                    </div>
                </aside>
                <div className="flowforge-inspector-page-markdown__content">
                    <MarkdownViewer value={markdown.toString()} />
                </div>
            </div>
        </InspectorPage>
    );
}
