import {MinusIcon, PlusIcon} from './icons';

/** − n + control. Clamps to [min, max]. */
export function QuantityStepper({
  value,
  min,
  max,
  disabled,
  size = 'md',
  onChange,
}: {
  value: number;
  min: number;
  max: number;
  disabled?: boolean;
  size?: 'sm' | 'md';
  onChange: (value: number) => void;
}) {
  return (
    <div className={`s-stepper s-stepper-${size}`} role="group" aria-label="Quantity">
      <button
        type="button"
        aria-label="Decrease quantity"
        disabled={disabled || value <= min}
        onClick={() => onChange(Math.max(min, value - 1))}
      >
        <MinusIcon size={16} />
      </button>
      <output aria-live="polite">{value}</output>
      <button
        type="button"
        aria-label="Increase quantity"
        disabled={disabled || value >= max}
        onClick={() => onChange(Math.min(max, value + 1))}
      >
        <PlusIcon size={16} />
      </button>
    </div>
  );
}
