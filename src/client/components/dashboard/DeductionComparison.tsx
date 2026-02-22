import type { DeductionBreakdown } from '@shared/types';

interface Props {
  deductions: DeductionBreakdown;
}

function fmt(n: number): string {
  return n.toLocaleString('en-US', { style: 'currency', currency: 'USD', maximumFractionDigits: 0 });
}

export default function DeductionComparison({ deductions }: Props) {
  const d = deductions;
  const savings = Math.abs(d.totalItemized - d.standardDeduction);

  return (
    <div className="bg-white rounded-lg border border-gray-200 p-6">
      <h2 className="text-lg font-semibold text-gray-900 mb-4">Deductions: Standard vs Itemized</h2>
      <div className="grid grid-cols-2 gap-6">
        {/* Itemized */}
        <div className={`p-4 rounded-lg border-2 ${d.usingItemized ? 'border-blue-500 bg-blue-50' : 'border-gray-200'}`}>
          <div className="flex items-center justify-between mb-3">
            <h3 className="font-medium text-gray-900">Itemized</h3>
            {d.usingItemized && <span className="text-xs bg-blue-100 text-blue-700 px-2 py-0.5 rounded">Selected</span>}
          </div>
          <div className="space-y-1 text-sm">
            <Row label="Mortgage Interest" value={fmt(d.mortgageInterest)} />
            <Row label="SALT (capped)" value={`${fmt(d.saltCapped)}${d.saltTotal > d.saltCapped ? ` of ${fmt(d.saltTotal)}` : ''}`} />
            <Row label="Charitable" value={fmt(d.charitableTotal)} />
            <hr className="border-gray-200 my-2" />
            <Row label="Total" value={fmt(d.totalItemized)} bold />
          </div>
        </div>

        {/* Standard */}
        <div className={`p-4 rounded-lg border-2 ${!d.usingItemized ? 'border-blue-500 bg-blue-50' : 'border-gray-200'}`}>
          <div className="flex items-center justify-between mb-3">
            <h3 className="font-medium text-gray-900">Standard</h3>
            {!d.usingItemized && <span className="text-xs bg-blue-100 text-blue-700 px-2 py-0.5 rounded">Selected</span>}
          </div>
          <div className="space-y-1 text-sm">
            <Row label="Standard Deduction" value={fmt(d.standardDeduction)} bold />
          </div>
        </div>
      </div>

      <p className="text-sm text-gray-500 mt-3">
        {d.usingItemized
          ? `Itemizing saves ${fmt(savings)} over standard deduction.`
          : `Standard deduction saves ${fmt(savings)} over itemizing.`}
      </p>
    </div>
  );
}

function Row({ label, value, bold }: { label: string; value: string; bold?: boolean }) {
  return (
    <div className="flex justify-between">
      <span className={bold ? 'font-semibold' : 'text-gray-600'}>{label}</span>
      <span className={bold ? 'font-semibold' : ''}>{value}</span>
    </div>
  );
}
