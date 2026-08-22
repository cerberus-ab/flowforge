import { FileText, ListTree } from 'lucide-preact';
import { Card } from '@/shared/components/Card';
import { Button } from '@/shared/components/Button';

interface UnderstandingProps {
    onOpenPageInspector: (tab?: string) => void;
}

export function Understanding({ onOpenPageInspector }: UnderstandingProps) {
    return (
        <Card title="Understanding" variant="secondary" transparent twinkle>
            <div className="flowforge-understanding-list">
                <ul>
                    <li key={'inspect-basics'}>
                        <Button
                            appearance="ghost"
                            size="small"
                            icon={ListTree}
                            title="See what FlowForge understands about this page"
                            onClick={() => onOpenPageInspector('basics')}
                        >
                            Inspect page context
                        </Button>
                    </li>
                    <li key={'inspect-semanticView'}>
                        <Button
                            appearance="ghost"
                            size="small"
                            icon={FileText}
                            title="See the page context as Markdown"
                            onClick={() => onOpenPageInspector('semanticView')}
                        >
                            .md
                        </Button>
                    </li>
                </ul>
            </div>
        </Card>
    );
}
