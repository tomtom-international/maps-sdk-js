import { type SelectHTMLAttributes } from 'react';

export type SelectOption<T extends string = string> = {
    value: T;
    label: string;
};

type SelectProps<T extends string> = Omit<SelectHTMLAttributes<HTMLSelectElement>, 'onChange' | 'value'> & {
    value: T;
    options: SelectOption<T>[];
    onChange: (value: T) => void;
    /** Optional bold form-label rendered above the control. */
    label?: string;
    /** Override the wrapping label classes — default is the compact form-label layout. */
    labelClassName?: string;
};

/**
 * Styled `<select>` wrapping the SDK's `.ui-dropdown` (height 44, rounded-10, primary
 * focus-ring, custom chevron via `background-image`). When `label` is provided it renders the
 * SDK form-label pattern: 12px bold caption above the field.
 */
export function Select<T extends string>({
    value,
    options,
    onChange,
    label,
    labelClassName,
    className,
    ...rest
}: SelectProps<T>) {
    const select = (
        <select
            {...rest}
            value={value}
            onChange={(event) => onChange(event.target.value as T)}
            className={['ui-dropdown', className].filter(Boolean).join(' ')}
        >
            {options.map((option) => (
                <option key={option.value} value={option.value}>
                    {option.label}
                </option>
            ))}
        </select>
    );

    if (!label) return select;

    const wrapClass =
        labelClassName ?? 'flex flex-col gap-1 text-[12px] leading-[16px] font-bold text-(--ui-text-med-em)';
    return (
        <label className={wrapClass}>
            <span>{label}</span>
            {select}
        </label>
    );
}
