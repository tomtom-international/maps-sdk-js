import type { ReactNode } from 'react';
import { Button, Toggle } from '../../components';

/**
 * Common chrome for every drawer panel — header (title + optional action button), hint text,
 * optional `controls` slot rendered between header and children, then children. Centralises the
 * spacing/typography so each panel stays terse.
 */
type PanelShellProps = {
    title: string;
    hint?: string;
    action?: { label: string; onClick: () => void };
    controls?: ReactNode;
    children: ReactNode;
};

export function PanelShell({ title, hint, action, controls, children }: PanelShellProps) {
    return (
        <div className="flex flex-col gap-3">
            <header className="flex items-center justify-between">
                <h3 className="m-0 text-[14px] font-semibold text-(--ui-text-high-em)">{title}</h3>
                {action && (
                    <Button variant="outline" size="xs" onClick={action.onClick}>
                        {action.label}
                    </Button>
                )}
            </header>
            {hint && <p className="m-0 text-[11px] text-(--ui-text-low-em)">{hint}</p>}
            {controls}
            {children}
        </div>
    );
}

/** Single labeled toggle-switch row used by the panel forms. */
export function ToggleRow({
    checked,
    disabled,
    label,
    onChange,
}: {
    checked: boolean;
    disabled?: boolean;
    label: string;
    onChange: () => void;
}) {
    return <Toggle checked={checked} disabled={disabled} label={label} onChange={() => onChange()} />;
}
