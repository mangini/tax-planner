import type { FBARResult } from '@shared/types';

interface Props {
  fbar: FBARResult;
}

function fmt(n: number): string {
  return n.toLocaleString('en-US', { style: 'currency', currency: 'USD', maximumFractionDigits: 0 });
}

export default function FBARStatusCard({ fbar }: Props) {
  if (fbar.accounts.length === 0) return null;

  return (
    <div className="bg-white rounded-lg border border-gray-200 p-6">
      <h2 className="text-lg font-semibold text-gray-900 mb-4">Foreign Account Reporting</h2>
      <div className="space-y-3">
        <div className="flex justify-between text-sm">
          <span className="text-gray-600">Aggregate Max Balance</span>
          <span className="font-semibold">{fmt(fbar.aggregateMaxBalance)}</span>
        </div>
        <div className="flex justify-between text-sm">
          <span className="text-gray-600">Aggregate Year-End Balance</span>
          <span className="font-semibold">{fmt(fbar.aggregateYearEndBalance)}</span>
        </div>
        <div className="flex gap-4">
          <StatusBadge
            label="FBAR (FinCEN 114)"
            required={fbar.fbarRequired}
            threshold="$10,000"
          />
          <StatusBadge
            label="Form 8938 (FATCA)"
            required={fbar.form8938Required}
            threshold="$50k/$100k year-end or $75k/$150k any time"
          />
        </div>
        {fbar.accounts.length > 0 && (
          <div className="mt-3 text-sm">
            <p className="text-gray-500 mb-2">{fbar.accounts.length} foreign account(s):</p>
            {fbar.accounts.map((a, i) => (
              <div key={i} className="flex justify-between text-gray-600">
                <span>{a.institution} ({a.country})</span>
                <span>{fmt(a.maxValue)}</span>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

function StatusBadge({ label, required, threshold }: { label: string; required: boolean; threshold: string }) {
  return (
    <div className={`flex-1 p-3 rounded-lg text-center ${required ? 'bg-red-50 border border-red-200' : 'bg-green-50 border border-green-200'}`}>
      <p className={`text-sm font-medium ${required ? 'text-red-700' : 'text-green-700'}`}>
        {label}
      </p>
      <p className={`text-xs mt-1 ${required ? 'text-red-600' : 'text-green-600'}`}>
        {required ? `Required (>${threshold})` : `Not required (<${threshold})`}
      </p>
    </div>
  );
}
