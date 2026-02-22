import { useState, useEffect } from 'react';
import type { TaxAmount } from '@shared/types';
import { amountValue } from '@shared/types';

interface Props {
  label: string;
  value: TaxAmount | undefined;
  onChange: (value: number) => void;
  estimated?: boolean;
  className?: string;
}

function fmtMoney(n: number): string {
  if (n === 0) return '';
  return n.toLocaleString('en-US', { maximumFractionDigits: 2 });
}

function parseMoney(s: string): number {
  return parseFloat(s.replace(/,/g, '')) || 0;
}

export default function MoneyInput({ label, value, onChange, estimated, className = '' }: Props) {
  const numVal = amountValue(value);
  const [focused, setFocused] = useState(false);
  const [raw, setRaw] = useState(numVal ? String(numVal) : '');

  useEffect(() => {
    if (!focused) setRaw(numVal ? String(numVal) : '');
  }, [numVal, focused]);

  return (
    <div className={`${className}`}>
      <label className="block text-xs text-gray-400 mb-0.5">
        {label}
      </label>
      <div className="relative">
        <span className="absolute left-2 top-1/2 -translate-y-1/2 text-gray-300 text-sm">$</span>
        <input
          type="text"
          inputMode="decimal"
          value={focused ? raw : fmtMoney(numVal)}
          onFocus={(e) => { setFocused(true); setRaw(numVal ? String(numVal) : ''); e.target.select(); }}
          onBlur={() => { setFocused(false); onChange(parseMoney(raw)); }}
          onChange={(e) => { setRaw(e.target.value); onChange(parseMoney(e.target.value)); }}
          className={`w-full border rounded px-2 py-1 pl-6 text-sm tabular-nums ${
            estimated
              ? 'border-amber-200 bg-amber-50/50'
              : 'border-gray-200 bg-white'
          }`}
        />
      </div>
    </div>
  );
}
