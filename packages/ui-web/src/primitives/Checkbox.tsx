import { Icon } from './Icon';
import './Checkbox.css';

export type CheckboxTone = 'neutral' | 'urgent' | 'upcoming';

type CheckboxProps = {
  checked: boolean;
  onToggle?: () => void;
  tone?: CheckboxTone;
  label: string;
  disabled?: boolean;
};

/** Circular task checkbox. Tone reflects priority; checked fills with upcoming. */
export function Checkbox({
  checked,
  onToggle,
  tone = 'neutral',
  label,
  disabled = false,
}: CheckboxProps) {
  return (
    <button
      type="button"
      className={`ds-checkbox ds-checkbox--${tone}${checked ? ' ds-checkbox--checked' : ''}${
        disabled ? ' ds-checkbox--disabled' : ''
      }`}
      onClick={disabled ? undefined : onToggle}
      aria-pressed={checked}
      aria-label={label}
      disabled={disabled}
    >
      {checked && <Icon name="check" size={11} tone="inherit" strokeWidth={3} />}
    </button>
  );
}
