import { ListTree } from 'lucide-preact';
import { Card } from '@/shared/components/Card';
import { Button } from '@/shared/components/Button';

interface DeveloperProps {
    onOpenPageInspector: () => void;
}

export function Developer({ onOpenPageInspector }: DeveloperProps) {
    return (
        <Card title="Understanding" variant="secondary" transparent twinkle>
            <div className="flowforge-developer-list">
                <ul>
                    <li key={'page-trail'}>
                        <Button
                            appearance="ghost"
                            size="small"
                            icon={ListTree}
                            title="See what FlowForge understands about this page"
                            onClick={onOpenPageInspector}
                        >
                            Inspect page context
                        </Button>
                    </li>
                </ul>
            </div>
        </Card>
    );
}
