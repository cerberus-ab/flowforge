import { FileText, ListTree } from 'lucide-preact';
import { Card } from '@/shared/components/Card';
import { Button } from '@/shared/components/Button';
import { Tooltip } from '@/shared/components/Tooltip';

interface AdvancedProps {
    onOpenPageInspector: (tab?: string) => void | Promise<void>;
}

export function Advanced({ onOpenPageInspector }: AdvancedProps) {
    return (
        <Card title="Advanced" variant="secondary" className="flowforge-advanced-container" twinkle>
            <div className="flowforge-advanced-list">
                <ul>
                    <li key={'inspect-basics'}>
                        <Tooltip content="See what FlowForge understands about this page." variant="secondary">
                            <Button
                                variant="secondary"
                                size="small"
                                icon={ListTree}
                                hollow
                                data-testid="flowforge-open-inspector"
                                onClick={() => void onOpenPageInspector('basics')}
                            >
                                Inspect page context
                            </Button>
                        </Tooltip>
                    </li>
                    <li key={'inspect-markdown'}>
                        <Tooltip content="See the page context as Markdown." variant="secondary">
                            <Button
                                variant="secondary"
                                size="small"
                                icon={FileText}
                                hollow
                                data-testid="flowforge-open-markdown-inspector"
                                onClick={() => void onOpenPageInspector('markdown')}
                            >
                                Markdown
                            </Button>
                        </Tooltip>
                    </li>
                </ul>
            </div>
        </Card>
    );
}
