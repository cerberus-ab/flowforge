import type { ComponentProps } from 'preact';
import { ChevronDown } from 'lucide-preact';
import { Icon } from '@/shared/components/Icon';
import { cx } from '@/shared/utils/cx';

export interface SelectOption<V extends string> {
    value: V;
    label: string;
    disabled?: boolean;
}

interface SelectProps<V extends string> extends Omit<
    ComponentProps<'select'>,
    'children' | 'onChange' | 'role' | 'value'
> {
    options: readonly SelectOption<V>[];
    value: V;
    variant?: 'primary' | 'secondary';
    onValueChange: (value: V) => void;
}

export function Select<V extends string>({
    options,
    value,
    variant = 'primary',
    onValueChange,
    className,
    ...props
}: SelectProps<V>) {
    return (
        <span className="flowforge-select-container">
            <select
                className={cx(
                    'flowforge-select',
                    `flowforge-select--${variant}`,
                    typeof className === 'string' ? className : undefined,
                )}
                value={value}
                onChange={(event) => onValueChange(event.currentTarget.value as V)}
                {...props}
            >
                {options.map((option) => (
                    <option key={option.value} value={option.value} disabled={option.disabled}>
                        {option.label}
                    </option>
                ))}
            </select>
            <Icon className="flowforge-select-icon" icon={ChevronDown} size="small" aria-hidden="true" />
        </span>
    );
}
