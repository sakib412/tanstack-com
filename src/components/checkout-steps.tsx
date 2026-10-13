import {CheckIcon} from './icons';

const STEPS = ['Cart', 'Details', 'Confirmation'];

/** Cart → Details → Confirmation progress, `current` is 0-based. */
export function CheckoutSteps({current}: {current: number}) {
  return (
    <ol className="s-steps" aria-label="Checkout progress">
      {STEPS.map((label, index) => {
        const state = index < current ? 'done' : index === current ? 'current' : 'todo';
        return (
          <li key={label} data-state={state} aria-current={state === 'current' ? 'step' : undefined}>
            <span className="s-step-dot">{state === 'done' ? <CheckIcon size={14} /> : index + 1}</span>
            <span className="s-step-label">{label}</span>
          </li>
        );
      })}
    </ol>
  );
}
