import { Card } from '@/shared/components/Card';
import { Button } from '@/shared/components/Button';
import { Link } from '@/shared/components/Link';

interface OpenerProps {
    website: string;
    onOpenPageInspector: (tab?: string) => void | Promise<void>;
}

export function Opener({ website, onOpenPageInspector }: OpenerProps) {
    return (
        <Card title="Explore page context" variant="secondary" className="flowforge-inspector-opener">
            <div className="flowforge-inspector-opener__description">
                <p>See what the current page contains and how it is organized.</p>
                <ul>
                    <li>Browse the page structure</li>
                    <li>Review content and interactive elements</li>
                    <li>Preview the page as Markdown</li>
                </ul>
            </div>
            <Button
                type="button"
                autoFocus
                size="large"
                variant="secondary"
                wide
                data-testid="flowforge-ip-opener-submit"
                onClick={() => void onOpenPageInspector()}
            >
                Open page inspector
            </Button>
            <p className="flowforge-inspector-opener__note">
                Part of <Link href={website}>Web Onboarding Assistant</Link>
            </p>
        </Card>
    );
}
