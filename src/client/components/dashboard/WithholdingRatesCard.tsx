import type { W2Data } from '@shared/types';
import { amountValue } from '@shared/types';

interface Props {
  w2s: W2Data[];
}

function fmt(n: number): string {
  return n.toLocaleString('en-US', { style: 'currency', currency: 'USD', maximumFractionDigits: 0 });
}

function pct(n: number): string {
  return (n * 100).toFixed(1) + '%';
}

const ownerLabel: Record<string, string> = { self: 'Self', spouse: 'Spouse', joint: 'Joint' };

export default function WithholdingRatesCard({ w2s }: Props) {
  if (w2s.length === 0) return null;

  const rows = w2s.map((w) => {
    const wages = amountValue(w.wages);
    const fedWithheld = amountValue(w.federalWithheld);
    const stateWithheld = amountValue(w.stateWithheld);
    return {
      employer: w.employer || '(unnamed)',
      owner: ownerLabel[w.owner] || w.owner,
      wages,
      fedWithheld,
      fedRate: wages > 0 ? fedWithheld / wages : 0,
      stateWithheld,
      stateRate: wages > 0 ? stateWithheld / wages : 0,
    };
  });

  return (
    <div className="bg-white rounded-lg border border-gray-200 p-6">
      <h2 className="text-lg font-semibold text-gray-900 mb-1">Withholding Rates by Employer</h2>
      <p className="text-xs text-gray-500 mb-4">Effective withholding % to help adjust W-4 for next year</p>
      <table className="w-full text-sm">
        <thead>
          <tr className="text-left text-gray-500 text-xs uppercase tracking-wide border-b border-gray-100">
            <th className="pb-2">Employer</th>
            <th className="pb-2">Who</th>
            <th className="pb-2 text-right">Wages</th>
            <th className="pb-2 text-right">Fed Withheld</th>
            <th className="pb-2 text-right">Fed %</th>
            <th className="pb-2 text-right">State Withheld</th>
            <th className="pb-2 text-right">State %</th>
          </tr>
        </thead>
        <tbody>
          {rows.map((r, i) => (
            <tr key={i} className="border-b border-gray-50">
              <td className="py-2 font-medium text-gray-900">{r.employer}</td>
              <td className="py-2 text-gray-500">{r.owner}</td>
              <td className="py-2 text-right">{fmt(r.wages)}</td>
              <td className="py-2 text-right">{fmt(r.fedWithheld)}</td>
              <td className="py-2 text-right font-semibold">{pct(r.fedRate)}</td>
              <td className="py-2 text-right">{fmt(r.stateWithheld)}</td>
              <td className="py-2 text-right font-semibold">{pct(r.stateRate)}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
