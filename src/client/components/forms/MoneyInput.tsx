import type { TaxAmount } from '@shared/types';
import { amountValue } from '@shared/types';

interface Props {
  label: string;
  value: TaxAmount | undefined;
  onChange: (value: number) => void;
  estimated?: boolean;
  className?: string;
}

export default function MoneyInput({ label, value, onChange, estimated, className = '' }: Props) {
  const numVal = amountValue(value);

  return (
    <div className={`${className}`}>
      <label className="block text-sm font-medium text-gray-700 mb-1">
        {label}
      </label>
      <div className="relative">
        <span className="absolute left-2 top-1/2 -translate-y-1/2 text-gray-400 text-sm">$</span>
        <input
          type="number"
          step="0.01"
          value={numVal || ''}
          onChange={(e) => onChange(parseFloat(e.target.value) || 0)}
          className={`w-full border rounded px-2 py-1.5 pl-6 text-sm ${
            estimated
              ? 'border-amber-300 bg-amber-50'
              : 'border-gray-300 bg-white'
          }`}
        />
      </div>
    </div>
  );
}
