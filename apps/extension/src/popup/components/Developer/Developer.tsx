import { Card } from '@/shared/components/Card';
import { ButtonText } from '@/shared/components/Button';

interface DeveloperProps {
    onOpenPageInspector: () => void;
}

export function Developer({ onOpenPageInspector }: DeveloperProps) {
    return (
        <Card title="Understanding" variant="secondary" twinkle>
            <div className="flowforge-developer-list">
                <ul>
                    <li key={'page-trail'}>
                        <ButtonText
                            variant="secondary"
                            tooltip="See what FlowForge understands about this page"
                            onClick={onOpenPageInspector}
                        >
                            Inspect page context
                        </ButtonText>
                    </li>
                </ul>
            </div>
        </Card>
    );
}
