import { FileText, ListTree } from 'lucide-preact';
import { Card } from '@/shared/components/Card';
import { Button } from '@/shared/components/Button';
import { Tooltip } from '@/shared/components/Tooltip';

interface UnderstandingProps {
    onOpenPageInspector: (tab?: string) => void;
}

export function Understanding({ onOpenPageInspector }: UnderstandingProps) {
    return (
        <Card title="Understanding" variant="secondary" transparent twinkle>
            <div className="flowforge-understanding-list">
                <ul>
                    <li key={'inspect-basics'}>
                        <Tooltip content="See what FlowForge understands about this page." variant="secondary">
                            <Button
                                appearance="ghost"
                                size="small"
                                icon={ListTree}
                                onClick={() => onOpenPageInspector('basics')}
                            >
                                Inspect page context
                            </Button>
                        </Tooltip>
                    </li>
                    <li key={'inspect-markdown'}>
                        <Tooltip content="See the page context as Markdown." variant="secondary">
                            <Button
                                appearance="ghost"
                                size="small"
                                icon={FileText}
                                onClick={() => onOpenPageInspector('markdown')}
                            >
                                .md
                            </Button>
                        </Tooltip>
                    </li>
                </ul>
            </div>
        </Card>
    );
}
