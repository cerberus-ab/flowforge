import type { ComponentProps } from 'preact';
import { useId } from 'preact/hooks';

interface SwitchProps extends Omit<
    ComponentProps<'button'>,
    'aria-checked' | 'children' | 'className' | 'onChange' | 'onClick' | 'role'
> {
    checked: boolean;
    label: string;
    onCheckedChange: (checked: boolean) => void | Promise<void>;
}

export function Switch({ checked, label, onCheckedChange, disabled, ...props }: SwitchProps) {
    const labelId = `flowforge-switch-label-${useId()}`;

    return (
        <button
            type="button"
            role="switch"
            aria-checked={checked}
            aria-labelledby={labelId}
            className="flowforge-switch"
            disabled={disabled}
            onClick={() => onCheckedChange(!checked)}
            {...props}
        >
            <span className="flowforge-switch__copy">
                <span id={labelId} className="flowforge-switch__label">
                    {label}
                </span>
            </span>
            <span className="flowforge-switch__control" aria-hidden="true">
                <span className="flowforge-switch__thumb" aria-hidden="true" />
            </span>
        </button>
    );
}
