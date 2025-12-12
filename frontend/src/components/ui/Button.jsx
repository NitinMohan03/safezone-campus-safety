// src/components/ui/Button.jsx
/**
 * A reusable button component.
 * @param {object} props
 * @param {React.ReactNode} props.children - The content inside the button (e.g., text)
 * @param {function} props.onClick - The function to call when the button is clicked
 * @param {string} [props.type='button'] - The button's type (e.g., 'button', 'submit')
 * @param {boolean} [props.disabled=false] - Whether the button is disabled
 */
function Button({
  children,
  onClick,
  type = 'button',
  disabled = false,
  variant = 'primary',
  className = '',
  ...props
}) {
  const baseClasses =
    'inline-flex items-center justify-center rounded-lg border border-transparent px-4 py-2 text-base font-semibold transition-colors duration-200 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary-200 disabled:cursor-not-allowed disabled:opacity-60 active:translate-y-px';

  const variantClasses = {
    primary: 'bg-primary-500 text-white hover:bg-primary-600',
    secondary: 'bg-slate-100 text-slate-800 hover:bg-primary-100',
    ghost:
      'border-slate-200 bg-transparent text-slate-700 hover:bg-primary-50 hover:text-primary-600',
  };

  const resolvedVariant = variantClasses[variant] || variantClasses.primary;
  const composedClasses = [baseClasses, resolvedVariant, className]
    .filter(Boolean)
    .join(' ');

  return (
    <button
      className={composedClasses}
      type={type}
      onClick={onClick}
      disabled={disabled}
      {...props}
    >
      {children}
    </button>
  );
}

export default Button;
