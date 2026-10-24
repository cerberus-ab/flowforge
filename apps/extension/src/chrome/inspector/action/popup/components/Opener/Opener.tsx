import { Card } from '@/shared/components/Card';
import { Button } from '@/shared/components/Button';
import { Link } from '@/shared/components/Link';

interface OpenerProps {
    website: string;
    onOpenPageInspector: () => void | Promise<void>;
    disabled?: boolean;
    error?: string | null;
}

export function Opener({ website, onOpenPageInspector, disabled = false, error }: OpenerProps) {
    return (
        <Card title="Inspect page context" variant="secondary" className="flowforge-inspector-opener">
            <div className="flowforge-inspector-opener__description">
                <p>See what the current page contains and how it is organized.</p>
                <ul>
                    <li>Explore the page structure</li>
                    <li>Review content and interactive elements</li>
                    <li>Preview the page as Markdown</li>
                </ul>
            </div>
            <Button
                type="button"
                autoFocus
                disabled={disabled}
                size="large"
                variant="secondary"
                wide
                data-testid="flowforge-ip-opener-submit"
                onClick={() => void onOpenPageInspector()}
            >
                Open page inspector
            </Button>
            {error && (
                <p className="flowforge-inspector-opener__error" role="alert">
                    {error}
                </p>
            )}
            <p className="flowforge-inspector-opener__note">
                Part of <Link href={website}>Web Onboarding Assistant</Link>
            </p>
        </Card>
    );
}
