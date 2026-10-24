import { Minus, Plus } from "lucide-react";
import clsx from "clsx";

export default function NumberStepper({
  value,
  onChange,
  min = 1,
  max = 999999,
  step = 1,
  disabled = false,
  className,
  id,
  name,
}) {
  const numValue = Number(value) || 0;

  const handleDecrement = () => {
    if (disabled || numValue <= min) return;
    onChange(Math.max(min, numValue - step));
  };

  const handleIncrement = () => {
    if (disabled || numValue >= max) return;
    onChange(Math.min(max, numValue + step));
  };

  const handleInputChange = (e) => {
    const val = e.target.value;
    if (val === "") {
      onChange("");
      return;
    }
    const parsed = Number(val);
    if (!isNaN(parsed)) {
      onChange(Math.min(max, Math.max(min, parsed)));
    }
  };

  return (
    <div
      className={clsx(
        "inline-flex items-center border border-border-strong rounded-btn bg-surface overflow-hidden h-11 focus-within:ring-2 focus-within:ring-primary focus-within:ring-offset-2",
        disabled && "opacity-50 cursor-not-allowed",
        className
      )}
    >
      <button
        type="button"
        onClick={handleDecrement}
        disabled={disabled || numValue <= min}
        aria-label="Decrease quantity"
        className="w-11 h-full flex items-center justify-center text-text hover:bg-surface-muted border-r border-border disabled:opacity-40 disabled:hover:bg-transparent transition-colors"
      >
        <Minus className="w-4 h-4 stroke-[2]" />
      </button>

      <input
        id={id}
        name={name}
        type="number"
        value={value}
        onChange={handleInputChange}
        disabled={disabled}
        min={min}
        max={max}
        step={step}
        className="w-20 text-center font-medium text-[16px] text-text bg-transparent border-0 outline-none tabular-nums [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none"
      />

      <button
        type="button"
        onClick={handleIncrement}
        disabled={disabled || numValue >= max}
        aria-label="Increase quantity"
        className="w-11 h-full flex items-center justify-center text-text hover:bg-surface-muted border-l border-border disabled:opacity-40 disabled:hover:bg-transparent transition-colors"
      >
        <Plus className="w-4 h-4 stroke-[2]" />
      </button>
    </div>
  );
}
