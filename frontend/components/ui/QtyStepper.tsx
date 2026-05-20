'use client';

interface QtyStepperProps {
  value: number;
  onChange: (value: number) => void;
  min?: number;
  step?: number;
}

export function QtyStepper({ value, onChange, min = 1, step = 1 }: QtyStepperProps) {
  return (
    <div className="flex items-center bg-brand rounded-[10px] border border-divider">
      <button
        onClick={() => onChange(Math.max(min, value - step))}
        className="w-8 h-9 grid place-items-center text-ink text-lg font-light cursor-pointer"
      >
        −
      </button>
      <span className="min-w-[32px] text-center text-sm font-bold font-mono text-ink">
        {value}
      </span>
      <button
        onClick={() => onChange(value + step)}
        className="w-8 h-9 grid place-items-center text-ink text-lg font-light cursor-pointer"
      >
        +
      </button>
    </div>
  );
}
