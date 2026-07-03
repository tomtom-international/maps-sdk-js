import { type ChangeEvent, useId } from 'react';

export type ToggleSize = 'sm' | 'md';
export type ToggleTone = 'success' | 'primary';

type ToggleProps = {
    checked: boolean;
    onChange: (checked: boolean) => void;
    /** Visible label rendered next to the switch. Omit for a label-less switch. */
    label?: string;
    disabled?: boolean;
    /** Forwarded to the input element. */
    id?: string;
    /** Hint shown via `title` (also used as aria-label when no `label` is given). */
    title?: string;
    /** "md" — 34×20 (SDK template default). "sm" — 30×17 (compact, used near the mic button). */
    size?: ToggleSize;
    /** "success" — green check, the SDK template default. "primary" — red, signals voice input. */
    tone?: ToggleTone;
    /** Override the wrapper label classes — pass `null` for a bare switch with no label slot. */
    labelClassName?: string | null;
};

// Geometry mirrors the SDK templates' `.sdk-example-toggle-switch` (md) and the chat-agent
// example's `.always-on-track` (sm). The thumb's translateX equals
// `track-width − thumb-width − 2 × inset(2px)`.
const SIZE_CLASS: Record<ToggleSize, string> = {
    md: 'h-5 w-[34px] after:h-4 after:w-4 peer-checked:after:translate-x-[14px]',
    sm: 'h-[17px] w-[30px] after:h-[13px] after:w-[13px] peer-checked:after:translate-x-[13px]',
};

const TONE_CLASS: Record<ToggleTone, string> = {
    success: 'peer-checked:bg-(--pb-color-success)',
    primary: 'peer-checked:bg-(--pb-primary-color)',
};

/**
 * Track-and-thumb toggle switch. Replicates `.sdk-example-toggle-switch` from the SDK templates
 * (success green by default) with a "primary" variant for the chat-agent's always-on mic toggle.
 */
export function Toggle({
    checked,
    onChange,
    label,
    disabled,
    id,
    title,
    size = 'md',
    tone = 'success',
    labelClassName,
}: ToggleProps) {
    const reactId = useId();
    const inputId = id ?? reactId;
    const handle = (event: ChangeEvent<HTMLInputElement>) => onChange(event.target.checked);

    const baseLabel =
        labelClassName === null
            ? ''
            : (labelClassName ??
              'flex cursor-pointer select-none items-center gap-3 py-1 text-[13px] leading-[18px] text-(--pb-text-high)');

    const trackClass = `relative inline-block shrink-0 rounded-full bg-(--pb-border-high) transition-colors duration-300 ease-in-out after:absolute after:left-0.5 after:top-0.5 after:rounded-full after:bg-(--pb-surface-0) after:shadow-[0_2px_4px_rgba(0,0,0,0.2)] after:transition-transform after:duration-300 after:ease-in-out after:content-[''] peer-disabled:cursor-not-allowed peer-disabled:opacity-50 ${SIZE_CLASS[size]} ${TONE_CLASS[tone]}`;

    return (
        <label className={`${baseLabel} ${disabled ? 'cursor-not-allowed opacity-50' : ''}`} title={title}>
            <input
                id={inputId}
                type="checkbox"
                checked={checked}
                onChange={handle}
                disabled={disabled}
                aria-label={label ?? title}
                className="peer absolute h-0 w-0 opacity-0"
            />
            <span aria-hidden="true" className={trackClass} />
            {label && <span className="flex-1 text-left">{label}</span>}
        </label>
    );
}
