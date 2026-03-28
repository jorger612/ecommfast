interface Props {
  value: number;
  min?: number;
  max: number;
  onChange: (value: number) => void;
}

export function QuantitySelector({ value, min = 1, max, onChange }: Props) {
  const decrement = () => { if (value > min) onChange(value - 1); };
  const increment = () => { if (value < max) onChange(value + 1); };

  const handleInput = (e: React.ChangeEvent<HTMLInputElement>) => {
    const parsed = parseInt(e.target.value, 10);
    if (!isNaN(parsed)) onChange(Math.max(min, Math.min(parsed, max)));
  };

  return (
    <div className="flex items-center gap-0">
      <button
        onClick={decrement}
        disabled={value <= min}
        aria-label="Reducir cantidad"
        className="w-10 h-10 flex items-center justify-center rounded-l-lg border border-gray-200
                   bg-white text-text hover:bg-surface disabled:opacity-40 disabled:cursor-not-allowed
                   transition-colors text-lg font-medium"
      >
        −
      </button>

      <input
        type="number"
        value={value}
        min={min}
        max={max}
        onChange={handleInput}
        className="w-14 h-10 text-center border-t border-b border-gray-200 bg-white
                   text-text font-semibold text-base focus:outline-none focus:ring-1
                   focus:ring-primary [appearance:textfield]
                   [&::-webkit-outer-spin-button]:appearance-none
                   [&::-webkit-inner-spin-button]:appearance-none"
      />

      <button
        onClick={increment}
        disabled={value >= max}
        aria-label="Aumentar cantidad"
        className="w-10 h-10 flex items-center justify-center rounded-r-lg border border-gray-200
                   bg-white text-text hover:bg-surface disabled:opacity-40 disabled:cursor-not-allowed
                   transition-colors text-lg font-medium"
      >
        +
      </button>

      <span className="ml-3 text-sm text-text-muted">
        {max === 1 ? '(último disponible)' : `máx. ${max}`}
      </span>
    </div>
  );
}
