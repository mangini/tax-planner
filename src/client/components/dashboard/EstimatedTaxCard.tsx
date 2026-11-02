import type { ComputationResult, EstimatedTaxResult, TaxYearData } from '@shared/types';
import { vestsInYear } from '@shared/rsu';

interface Props {
  data: TaxYearData;
  result: ComputationResult;
}

function fmt(n: number): string {
  return n.toLocaleString('en-US', { style: 'currency', currency: 'USD', maximumFractionDigits: 0 });
}

function fmtDate(iso: string): string {
  const [y, m, d] = iso.split('-').map(Number);
  return new Date(Date.UTC(y, m - 1, d)).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric', timeZone: 'UTC' });
}

function Status({ r }: { r: EstimatedTaxResult }) {
  if (r.exempt) {
    return <p className="text-sm text-green-700 font-medium">No estimate needed. {r.exemptReason}</p>;
  }
  if (r.nextDue && r.nextDue.amount > 0) {
    return (
      <p className="text-sm text-red-700 font-medium">
        Pay {fmt(r.nextDue.amount)} by {fmtDate(r.nextDue.dueDate)} ({r.nextDue.label})
      </p>
    );
  }
  if (!r.nextDue) {
    return <p className="text-sm text-amber-700 font-medium">All due dates have passed; any shortfall is due with the return.</p>;
  }
  return <p className="text-sm text-green-700 font-medium">On track for {r.nextDue.label}.</p>;
}

function Jurisdiction({ title, r }: { title: string; r: EstimatedTaxResult }) {
  const pct = (n: number) => `${Math.round(n * 100)}%`;
  return (
    <div className="space-y-3">
      <h3 className="text-sm font-medium text-gray-500 uppercase tracking-wide">{title}</h3>
      <Status r={r} />
      <div className="text-xs text-gray-600 space-y-0.5">
        <div className="flex justify-between"><span>Projected tax</span><span className="tabular-nums">{fmt(r.currentYearTax)}</span></div>
        <div className="flex justify-between">
          <span>
            Prior-year tax
            {r.priorYearSource === 'computed' && <span className="text-amber-600"> (from this tool — enter actual on Estimated Payments)</span>}
          </span>
          <span className="tabular-nums">{r.priorYearTax !== null ? fmt(r.priorYearTax) : '—'}</span>
        </div>
        <div className="flex justify-between font-medium">
          <span>Required ({r.basis === 'prior-year' ? 'prior-year test' : 'current-year test'})</span>
          <span className="tabular-nums">{fmt(r.requiredAnnualPayment)}</span>
        </div>
        <div className="flex justify-between"><span>Projected withholding</span><span className="tabular-nums">{fmt(r.projectedWithholding)}</span></div>
        <div className="flex justify-between"><span>Estimates paid</span><span className="tabular-nums">{fmt(r.estimatesPaid)}</span></div>
        <div className="flex justify-between"><span>Projected balance due at filing</span><span className="tabular-nums">{fmt(r.projectedBalanceDue)}</span></div>
      </div>

      <div className="overflow-x-auto">
        <table className="w-full text-xs tabular-nums">
          <thead>
            <tr className="text-gray-400 text-right">
              <th className="text-left font-normal py-1">Due</th>
              <th className="font-normal">Required</th>
              <th className="font-normal">Withheld</th>
              <th className="font-normal">Estimates</th>
              <th className="font-normal">Short</th>
              <th className="font-normal">Pay</th>
            </tr>
          </thead>
          <tbody>
            {r.quarters.map((q) => (
              <tr key={q.label} className={`border-t border-gray-100 text-right ${q.isPast ? 'text-gray-400' : ''}`}>
                <td className="text-left py-1">{q.label} · {fmtDate(q.dueDate)}</td>
                <td>{fmt(q.requiredCumulative)}</td>
                <td>{fmt(q.withholdingCumulative)}</td>
                <td>{fmt(q.estimatesCumulative)}</td>
                <td className={q.shortfall > 0 ? 'text-red-600' : ''}>{fmt(q.shortfall)}</td>
                <td className="font-medium">{q.suggestedPayment > 0 ? fmt(q.suggestedPayment) : '—'}</td>
              </tr>
            ))}
          </tbody>
        </table>
        <p className="text-[11px] text-gray-400 mt-1">Cumulative amounts. Withholding counts as paid evenly across quarters.</p>
      </div>

      {!r.exempt && (
        <div className="text-xs text-gray-600 space-y-0.5">
          <div className="flex justify-between">
            <span>Est. penalty if you pay nothing more</span>
            <span className="tabular-nums">{fmt(r.penaltyIfNothingPaid)}</span>
          </div>
          <div className="flex justify-between">
            <span>Est. penalty if you pay as suggested</span>
            <span className="tabular-nums">{fmt(r.penaltyIfSuggestedPaid)}</span>
          </div>
          {r.extraWithholdingPerPaycheck !== null && (
            <p className="pt-1 text-gray-500">
              Alternative: add {fmt(r.extraWithholdingPerPaycheck)} extra withholding on each of the{' '}
              {r.remainingPaychecks} remaining paychecks (W-4 line 4c). Withholding is treated as paid
              evenly, so it also covers past quarters.
            </p>
          )}
          {r.extraWithholdingPerPaycheck === null && r.remainingPaychecks === null && (
            <p className="pt-1 text-gray-400">
              Use the W-2 YTD estimator to see the extra-withholding alternative per paycheck.
            </p>
          )}
        </div>
      )}
    </div>
  );
}

export default function EstimatedTaxCard({ data, result }: Props) {
  const est = result.estimatedTax;
  if (!est) return null;

  // Upcoming vests and their federal withholding gap at each owner's elected supplemental rate
  const upcoming = vestsInYear(data.rsuGrants, data.rsuPrices, data.year, { after: est.asOf });
  const marginal = result.federal.marginalRate;
  const rateFor = (owner: string) =>
    data.w2.find((w) => w.owner === owner && w.ytdEstimator)?.ytdEstimator?.supplementalFederalRate ?? 0.22;
  const pctLabel = (r: number) => `${Math.round(r * 1000) / 10}%`;
  const w2Includes = data.w2.some((w) => w.ytdProjection);

  return (
    <div className="bg-white rounded-lg border border-gray-200 p-6">
      <div className="flex items-baseline justify-between mb-4">
        <h2 className="text-lg font-semibold text-gray-900">Quarterly Estimates</h2>
        <span className="text-xs text-gray-400">as of {fmtDate(est.asOf)}</span>
      </div>
      <div className="grid grid-cols-2 gap-8">
        <Jurisdiction title="Federal" r={est.federal} />
        <Jurisdiction title="Colorado" r={est.colorado} />
      </div>

      {upcoming.length > 0 && (
        <div className="mt-6 border-t border-gray-100 pt-4">
          <h3 className="text-sm font-medium text-gray-500 uppercase tracking-wide mb-2">Upcoming RSU vests</h3>
          {!w2Includes && (
            <p className="text-xs text-amber-700 mb-2">
              These aren't in the projection yet: open the W-2, mark it as an estimate and apply the YTD estimator.
            </p>
          )}
          <table className="w-full text-xs tabular-nums">
            <thead>
              <tr className="text-gray-400 text-right">
                <th className="text-left font-normal py-1">Date</th>
                <th className="text-left font-normal">Grant</th>
                <th className="font-normal">Shares</th>
                <th className="font-normal">Value</th>
                <th className="font-normal">Withheld</th>
                <th className="font-normal">Under-withheld @{Math.round(marginal * 100)}%</th>
              </tr>
            </thead>
            <tbody>
              {upcoming.map((v, i) => (
                <tr key={i} className="border-t border-gray-100 text-right">
                  <td className="text-left py-1">{fmtDate(v.date)}</td>
                  <td className="text-left text-gray-500">{v.grantName}</td>
                  <td>{v.shares.toLocaleString('en-US')}</td>
                  <td>{v.price !== null ? fmt(v.value) : 'no price'}</td>
                  <td>{v.price !== null ? `${fmt(v.value * rateFor(v.owner))} @${pctLabel(rateFor(v.owner))}` : '—'}</td>
                  <td className="text-red-600">{v.price !== null ? fmt(v.value * Math.max(0, marginal - rateFor(v.owner))) : '—'}</td>
                </tr>
              ))}
            </tbody>
          </table>
          <p className="text-[11px] text-gray-400 mt-1">
            Federal only; Colorado withholds vests at its flat rate, so there's no Colorado gap.
          </p>
        </div>
      )}
    </div>
  );
}
