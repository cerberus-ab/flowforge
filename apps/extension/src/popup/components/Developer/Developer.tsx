import { Card } from '@/shared/components/Card';
import { ButtonText } from '@/shared/components/Button';
import type { DeveloperViewModel } from '@/popup/hooks/usePopup.types';

export function Developer({ openPageInspector }: DeveloperViewModel) {
    return (
        <Card title="Understanding" variant="secondary" twinkle>
            <div className="flowforge-developer-list">
                <ul>
                    <li key={'page-trail'}>
                        <ButtonText
                            variant="secondary"
                            tooltip="See what FlowForge understands about this page"
                            onClick={openPageInspector}
                        >
                            Inspect page context
                        </ButtonText>
                    </li>
                </ul>
            </div>
        </Card>
    );
}