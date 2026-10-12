import * as Tooltip from '@radix-ui/react-tooltip';
import type { LucideIcon } from 'lucide-react';
import { type ReactElement, type ReactNode, useId, useState } from 'react';

export const Field = ({ label, children }: { label: string; children: ReactNode }) => (
    <label className="ui-form-field">
        <span className="ui-form-label">{label}</span>
        {children}
    </label>
);

/** A field holding several controls, which label themselves: a `<label>` around them would nest labels. */
export const FieldGroup = ({ label, children }: { label: string; children: ReactNode }) => (
    <div className="ui-form-field">
        <span className="ui-form-label">{label}</span>
        {children}
    </div>
);

type SelectProps<Value extends string | number | undefined> = {
    value: Value;
    options: readonly Value[];
    optionLabel: (option: Value) => string;
    onChange: (value: Value) => void;
    'aria-label'?: string;
};

/** A dropdown over typed options, read back by position so no value needs parsing. */
export const Select = <Value extends string | number | undefined>({
    value,
    options,
    optionLabel,
    onChange,
    'aria-label': ariaLabel,
}: SelectProps<Value>) => (
    <select
        className="ui-dropdown"
        aria-label={ariaLabel}
        value={String(value ?? '')}
        onChange={(event) => onChange(options[event.target.selectedIndex])}
    >
        {options.map((option) => (
            <option key={String(option ?? '')} value={String(option ?? '')}>
                {optionLabel(option)}
            </option>
        ))}
    </select>
);

/** What a chip shows for an option: its label, and an icon where one helps the eye. */
export type ChipLook = { label: string; icon?: LucideIcon };

type HintProps = { label: string; disabled?: boolean; children: ReactElement };

/** A tooltip naming what an icon stands for, on hover and on keyboard focus. */
export const Hint = ({ label, disabled = false, children }: HintProps) => {
    // Held open or shut here, so `disabled` switches it off without remounting the trigger.
    const [open, setOpen] = useState(false);
    return (
        <Tooltip.Root open={open && !disabled} onOpenChange={setOpen}>
            <Tooltip.Trigger asChild>{children}</Tooltip.Trigger>
            <Tooltip.Portal>
                <Tooltip.Content className="ui-tooltip" sideOffset={6} collisionPadding={8}>
                    {label}
                    <Tooltip.Arrow className="ui-tooltip-arrow" />
                </Tooltip.Content>
            </Tooltip.Portal>
        </Tooltip.Root>
    );
};

type CollapseToggleProps = { label: string; collapsed: boolean; onToggle: () => void };

/** The chevron in a panel's heading that folds its content away. */
export const CollapseToggle = ({ label, collapsed, onToggle }: CollapseToggleProps) => (
    <button
        type="button"
        className="ui-heading-toggle"
        aria-label={label}
        aria-expanded={!collapsed}
        onClick={onToggle}
    >
        <svg className="ui-heading-chevron" viewBox="0 0 16 10" aria-hidden="true">
            <path d="M3 1.5L8 6.5L13 1.5" />
        </svg>
    </button>
);

/**
 * A compact chip shows only its icon until selected, and names itself in a tooltip meanwhile. The
 * label stays in the markup for screen readers.
 */
const useChipFace = ({ label, icon: Icon }: ChipLook, active: boolean, compact: boolean) => {
    const iconOnly = compact && Icon !== undefined && !active;
    return {
        iconOnly,
        className: `ui-button ui-toggle ui-button-xs ui-button-with-icon ui-chip${iconOnly ? ' is-icon-only' : ''}${active ? ' active' : ''}`,
        face: (
            <>
                {Icon && <Icon />}
                <span className={iconOnly ? 'ui-sr-only' : undefined}>{label}</span>
            </>
        ),
    };
};

type ChipButtonProps = { look: ChipLook; active: boolean; compact?: boolean; onClick: () => void };

/** A chip that toggles something on and off. */
export const ChipButton = ({ look, active, compact = false, onClick }: ChipButtonProps) => {
    const { iconOnly, className, face } = useChipFace(look, active, compact);
    return (
        <Hint label={look.label} disabled={!iconOnly}>
            <button type="button" className={className} aria-pressed={active} onClick={onClick}>
                {face}
            </button>
        </Hint>
    );
};

type ChipProps = { look: ChipLook; active: boolean; compact: boolean; children: ReactNode };

const Chip = ({ look, active, compact, children }: ChipProps) => {
    const { iconOnly, className, face } = useChipFace(look, active, compact);
    return (
        <Hint label={look.label} disabled={!iconOnly}>
            <label className={className}>
                {children}
                {face}
            </label>
        </Hint>
    );
};

type ChipGroupProps<Value extends string> = {
    label: string;
    options: readonly Value[];
    look: (option: Value) => ChipLook;
    /** Icon chips show their label only while selected. */
    compact?: boolean;
};

type ChipChoiceProps<Value extends string> = ChipGroupProps<Value> & {
    value: Value;
    onChange: (value: Value) => void;
    disabled?: (option: Value) => boolean;
};

/** One of a few options as chips, each a radio input underneath. */
export const ChipChoice = <Value extends string>({
    label,
    options,
    look,
    compact = false,
    value,
    onChange,
    disabled,
}: ChipChoiceProps<Value>) => {
    const name = useId();
    return (
        <div className="ui-chip-list" role="radiogroup" aria-label={label}>
            {options.map((option) => (
                <Chip key={option} look={look(option)} active={option === value} compact={compact}>
                    <input
                        className="ui-visually-hidden"
                        type="radio"
                        name={name}
                        checked={option === value}
                        disabled={disabled?.(option)}
                        onChange={() => onChange(option)}
                    />
                </Chip>
            ))}
        </div>
    );
};

type ChipChecklistProps<Value extends string> = ChipGroupProps<Value> & {
    selected?: readonly string[];
    onChange: (selected: Value[]) => void;
};

/** Any number of options as chips, each a checkbox underneath. A change keeps only the options offered, in their order. */
export const ChipChecklist = <Value extends string>({
    label,
    options,
    look,
    compact = false,
    selected = [],
    onChange,
}: ChipChecklistProps<Value>) => (
    <div className="ui-chip-list" role="group" aria-label={label}>
        {options.map((option) => (
            <Chip key={option} look={look(option)} active={selected.includes(option)} compact={compact}>
                <input
                    className="ui-visually-hidden"
                    type="checkbox"
                    checked={selected.includes(option)}
                    onChange={(event) =>
                        onChange(
                            options.filter((each) =>
                                each === option ? event.target.checked : selected.includes(each),
                            ),
                        )
                    }
                />
            </Chip>
        ))}
    </div>
);

type ToggleProps = { label: string; checked: boolean; onChange: (checked: boolean) => void };

export const Toggle = ({ label, checked, onChange }: ToggleProps) => (
    <label className="ui-toggle-label">
        <span>{label}</span>
        <input
            className="ui-toggle-input"
            type="checkbox"
            checked={checked}
            onChange={(event) => onChange(event.target.checked)}
        />
        <span className="ui-toggle-switch" />
    </label>
);

type FactorSliderProps = {
    label: string;
    value: number;
    min?: number;
    max?: number;
    onChange: (value: number) => void;
};

export const FactorSlider = ({ label, value, min = 0.5, max = 1.5, onChange }: FactorSliderProps) => (
    <Field label={label}>
        <span className="ui-slider-container">
            <input
                className="ui-slider"
                type="range"
                min={min}
                max={max}
                step={0.1}
                value={value}
                onChange={(event) => onChange(Number(event.target.value))}
            />
            <span className="ui-slider-value">{value.toFixed(1)}×</span>
        </span>
    </Field>
);
