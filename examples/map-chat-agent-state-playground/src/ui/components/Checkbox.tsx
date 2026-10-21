import { type ChangeEvent } from 'react';

type CheckboxProps = {
    checked: boolean;
    onChange: (checked: boolean) => void;
    label: string;
    disabled?: boolean;
    /** Override label spacing — defaults to the compact panel-row layout. */
    className?: string;
};

/**
 * Single labelled checkbox row. Mirrors `.ui-checkbox-label` from the SDK templates:
 * 16×16 input with `accent-color: var(--ui-surface-brand-red)`, body-s label, primary-color focus
 * outline. The default class list keeps panel-toggle rows compact (smaller gap, no margin).
 */
export function Checkbox({ checked, onChange, label, disabled, className }: CheckboxProps) {
    const handle = (event: ChangeEvent<HTMLInputElement>) => onChange(event.target.checked);
    const labelClass =
        className ??
        `flex cursor-pointer items-center gap-2 py-1 text-[13px] leading-[18px] text-(--ui-text-high-em) ${
            disabled ? 'cursor-not-allowed opacity-50' : ''
        }`;
    return (
        <label className={labelClass}>
            <input
                type="checkbox"
                checked={checked}
                disabled={disabled}
                onChange={handle}
                className="h-4 w-4 shrink-0 cursor-pointer rounded-(--ui-rounded-5) accent-(--ui-surface-brand-red) focus:outline-2 focus:outline-offset-2 focus:outline-(--ui-surface-brand-red) disabled:cursor-not-allowed"
            />
            <span>{label}</span>
        </label>
    );
}
