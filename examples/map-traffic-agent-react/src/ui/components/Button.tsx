import { type ButtonHTMLAttributes, forwardRef, type ReactNode } from 'react';

// Mirrors the variants in `examples/src/templates/css/button/variants.css`. Adding a variant here
// keeps the Tailwind/React surface in sync with the SDK CSS contract — no need to remember the
// raw `sdk-example-button-*` class names at every call site.
export type ButtonVariant =
    | 'primary'
    | 'secondary'
    | 'tertiary'
    | 'outline'
    | 'ghost'
    | 'success'
    | 'warning'
    | 'toggle';

export type ButtonSize = 'xs' | 'sm' | 'md' | 'lg' | 'xl';

type ButtonProps = ButtonHTMLAttributes<HTMLButtonElement> & {
    variant?: ButtonVariant;
    size?: ButtonSize;
    /** For `variant="toggle"` — applies the `.active` modifier. */
    active?: boolean;
    fullWidth?: boolean;
    /** Strips text padding and renders a square icon button. */
    iconOnly?: boolean;
    /** Shows a spinner overlay and disables interaction. */
    loading?: boolean;
    /** Optional leading icon — only rendered when present. */
    leadingIcon?: ReactNode;
    /** Optional trailing icon — only rendered when present. */
    trailingIcon?: ReactNode;
};

const VARIANT_CLASS: Record<ButtonVariant, string> = {
    primary: '',
    secondary: 'sdk-example-button-secondary',
    tertiary: 'sdk-example-button-tertiary',
    outline: 'sdk-example-button-outline',
    ghost: 'sdk-example-button-ghost',
    success: 'sdk-example-button-success',
    warning: 'sdk-example-button-warning',
    toggle: 'sdk-example-toggle',
};

const SIZE_CLASS: Record<ButtonSize, string> = {
    xs: 'sdk-example-button-xs',
    sm: 'sdk-example-button-sm',
    md: '',
    lg: 'sdk-example-button-lg',
    xl: 'sdk-example-button-xl',
};

export const Button = forwardRef<HTMLButtonElement, ButtonProps>(function Button(
    {
        variant = 'primary',
        size = 'md',
        active,
        fullWidth,
        iconOnly,
        loading,
        leadingIcon,
        trailingIcon,
        className,
        children,
        type = 'button',
        ...rest
    },
    ref,
) {
    const hasIcon = leadingIcon != null || trailingIcon != null;
    const composed = [
        'sdk-example-button',
        VARIANT_CLASS[variant],
        SIZE_CLASS[size],
        fullWidth && 'sdk-example-button-full',
        iconOnly && 'sdk-example-button-icon',
        hasIcon && 'sdk-example-button-with-icon',
        loading && 'sdk-example-button-loading',
        active && 'active',
        className,
    ]
        .filter(Boolean)
        .join(' ');

    return (
        <button {...rest} ref={ref} type={type} className={composed}>
            {leadingIcon}
            {children}
            {trailingIcon}
        </button>
    );
});
