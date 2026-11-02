import { useState } from 'react';
import type {
  YearConfig,
  RSUGrant,
  FormOwner,
  W2YTDProjectionInfo,
  YTDEstimatorInputs,
  YTDEstimatorVest,
} from '@shared/types';
import { vestsInYear } from '@shared/rsu';
import { PAY_FREQUENCIES, payPeriodsCompleted, payPeriodsEndedBefore, periodsPerYear, type PayFrequency } from '@shared/pay-periods';
import { projectYTD, type YTDProjection } from '@shared/ytd-projection';

type NumericField =
  | 'ytdGrossPay' | 'ytdSalary' | 'ytdPreTaxDeductions' | 'ytdFederalTax'
  | 'ytdStateTax' | 'ytdOasdi' | 'ytdMedicare' | 'ytdHsa' | 'extraFederalPerPaycheck';

interface Props {
  config: YearConfig;
  year: number;
  owner: FormOwner;
  grants: RSUGrant[];
  prices: Record<string, number>;
  /** Saved inputs from the W-2, if any */
  saved: YTDEstimatorInputs | undefined;
  /** Called on every change so the W-2 form can persist the inputs on Save */
  onInputsChange: (inputs: YTDEstimatorInputs) => void;
  onApply: (values: YTDProjection & { ytdProjection: W2YTDProjectionInfo }) => void;
}

/** Supplemental withholding rates employees can typically elect for RSUs */
const MIN_SUPPLEMENTAL_RATE = 0.22;
const MAX_SUPPLEMENTAL_RATE = 0.37;

export const defaultEstimatorInputs: YTDEstimatorInputs = {
  payPeriodEnd: '',
  payFrequency: 'semimonthly',
  ytdGrossPay: 0,
  ytdSalary: 0,
  ytdPreTaxDeductions: 0,
  ytdFederalTax: 0,
  ytdStateTax: 0,
  ytdOasdi: 0,
  ytdMedicare: 0,
  ytdHsa: 0,
  supplementalFederalRate: MIN_SUPPLEMENTAL_RATE,
  extraFederalPerPaycheck: 0,
  extraFederalStart: '',
  rsuVests: [],
  rsuFromGrants: true,
};

function fmt(n: number): string {
  return n.toLocaleString('en-US', { style: 'currency', currency: 'USD', maximumFractionDigits: 0 });
}

function localToday(): string {
  const d = new Date();
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
}

export default function YTDEstimator({ config, year, owner, grants, prices, saved, onInputsChange, onApply }: Props) {
  const [open, setOpen] = useState(!!saved);
  const [inputs, setInputsState] = useState<YTDEstimatorInputs>({ ...defaultEstimatorInputs, ...saved });
  // Raw text of the rate field, so typing "2" on the way to "23" isn't rejected
  const [rateText, setRateText] = useState(String(Math.round(inputs.supplementalFederalRate * 1000) / 10));

  const setInputs = (next: YTDEstimatorInputs) => {
    setInputsState(next);
    onInputsChange(next);
  };

  // Vests after the payslip date (or today, before a date is entered), from RSU Grants
  const after = inputs.payPeriodEnd || localToday();
  const fromGrants: YTDEstimatorVest[] = vestsInYear(grants, prices, year, { owner, after }).map((v) => ({
    date: v.date,
    shares: v.shares,
    price: v.price ?? 0,
  }));
  const vests = inputs.rsuFromGrants ? fromGrants : inputs.rsuVests;
  const remainingRsuVests = Math.round(vests.reduce((s, v) => s + v.shares * v.price, 0) * 100) / 100;
  const unpriced = vests.some((v) => v.shares > 0 && !v.price);

  // Editing a row switches to a saved, manual copy of the list
  const editVests = (update: (rows: YTDEstimatorVest[]) => YTDEstimatorVest[]) =>
    setInputs({ ...inputs, rsuFromGrants: false, rsuVests: update(vests.map((v) => ({ ...v }))) });

  const ratePct = parseFloat(rateText);
  const rateValid =
    Number.isFinite(ratePct) && ratePct >= MIN_SUPPLEMENTAL_RATE * 100 && ratePct <= MAX_SUPPLEMENTAL_RATE * 100;
  const onRateChange = (text: string) => {
    setRateText(text);
    const pct = parseFloat(text);
    if (Number.isFinite(pct) && pct >= MIN_SUPPLEMENTAL_RATE * 100 && pct <= MAX_SUPPLEMENTAL_RATE * 100) {
      setInputs({ ...inputs, supplementalFederalRate: pct / 100 });
    }
  };

  const completed = payPeriodsCompleted(inputs.payPeriodEnd, inputs.payFrequency);
  const total = periodsPerYear(inputs.payFrequency);
  const nonRecurringYTD = Math.max(0, inputs.ytdGrossPay - inputs.ytdSalary);

  // W-4 extra withholding: how many paychecks already had it, and how many still will
  let extraFederal: { perPaycheck: number; periodsInYTD: number; futurePeriods: number } | undefined;
  if (completed && inputs.extraFederalPerPaycheck > 0) {
    const remainingPeriods = Math.max(0, total - completed);
    const start = inputs.extraFederalStart;
    const endedBeforeStart = start
      ? payPeriodsEndedBefore(start, inputs.payFrequency, inputs.payPeriodEnd) ?? 0
      : completed;
    extraFederal =
      start && start <= inputs.payPeriodEnd
        ? { perPaycheck: inputs.extraFederalPerPaycheck, periodsInYTD: Math.max(0, completed - endedBeforeStart), futurePeriods: remainingPeriods }
        : { perPaycheck: inputs.extraFederalPerPaycheck, periodsInYTD: 0, futurePeriods: Math.max(0, Math.min(remainingPeriods, total - endedBeforeStart)) };
  }
  const salaryMissing = inputs.ytdGrossPay > 0 && inputs.ytdSalary <= 0;

  const projected =
    completed && !salaryMissing
      ? projectYTD({
          periodsCompleted: completed,
          periodsPerYear: total,
          ytdGrossPay: inputs.ytdGrossPay,
          ytdSalary: inputs.ytdSalary,
          ytdPreTaxDeductions: inputs.ytdPreTaxDeductions,
          ytdFederalTax: inputs.ytdFederalTax,
          ytdStateTax: inputs.ytdStateTax,
          ytdOasdi: inputs.ytdOasdi,
          ytdMedicare: inputs.ytdMedicare,
          ytdHsaEmployer: inputs.ytdHsa,
          remainingRsuVests,
          supplementalFederalRate: inputs.supplementalFederalRate,
          supplementalStateRate: config.colorado.flatRate,
          extraFederal,
          ssWageBase: config.socialSecurity.wageBase,
          ssRate: config.socialSecurity.employeeRate,
          medicareRate: config.socialSecurity.medicareRate,
        })
      : null;

  const set = (field: NumericField, value: string) => setInputs({ ...inputs, [field]: parseFloat(value) || 0 });

  const inputClass = "border border-gray-300 rounded px-2 py-1.5 text-sm w-full";
  const cellClass = "border border-gray-200 rounded px-1.5 py-0.5 text-xs w-full text-right tabular-nums";

  const money = (field: NumericField, label: string, hint?: string) => (
    <div>
      <label className="block text-xs font-medium text-gray-600 mb-1">{label}</label>
      <input type="number" step="0.01" value={inputs[field] || ''} onChange={(e) => set(field, e.target.value)} className={inputClass} />
      {hint && <p className="text-[11px] text-gray-400 mt-0.5">{hint}</p>}
    </div>
  );

  return (
    <div className="mb-4 border border-amber-200 rounded bg-amber-50/50">
      <button
        type="button"
        onClick={() => setOpen(!open)}
        className="w-full px-4 py-2 text-left text-sm font-medium text-amber-800 hover:bg-amber-100/50 flex justify-between items-center"
      >
        <span>
          YTD Estimator
          {saved?.payPeriodEnd && <span className="ml-2 text-xs font-normal text-amber-600">payslip {saved.payPeriodEnd}</span>}
        </span>
        <span className="text-xs">{open ? '▲' : '▼'}</span>
      </button>

      {open && (
        <div className="px-4 pb-4 space-y-4">
          <p className="text-xs text-amber-700">
            Enter YTD values from your latest payslip. Salary is extrapolated across the remaining
            pay periods; RSU vests and bonuses already paid are kept as-is. Inputs are saved with the W-2.
          </p>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-medium text-gray-600 mb-1">Pay period end date</label>
              <input type="date" value={inputs.payPeriodEnd} onChange={(e) => setInputs({ ...inputs, payPeriodEnd: e.target.value })} className={inputClass} />
            </div>
            <div>
              <label className="block text-xs font-medium text-gray-600 mb-1">Pay frequency</label>
              <select value={inputs.payFrequency} onChange={(e) => setInputs({ ...inputs, payFrequency: e.target.value as PayFrequency })} className={inputClass}>
                {PAY_FREQUENCIES.map((f) => <option key={f.value} value={f.value}>{f.label}</option>)}
              </select>
            </div>
          </div>
          {completed !== null && (
            <p className="text-xs text-gray-600 -mt-2">
              {completed} of {total} pay periods completed
            </p>
          )}

          <div className="grid grid-cols-2 gap-3">
            {money('ytdGrossPay', 'YTD Gross Pay', 'Includes vested RSUs and bonuses')}
            {money('ytdSalary', 'YTD Salary', 'Regular base pay only')}
            {money('ytdPreTaxDeductions', 'YTD Pre-Tax Deductions')}
            {money('ytdFederalTax', 'YTD Federal Tax')}
            {money('ytdStateTax', 'YTD State Tax')}
            {money('ytdOasdi', 'YTD OASDI (Social Security)')}
            {money('ytdMedicare', 'YTD Medicare')}
            {money('ytdHsa', 'YTD HSA (Employer)')}
          </div>
          <div className="grid grid-cols-2 gap-3">
            {money('extraFederalPerPaycheck', 'Extra federal withholding per paycheck', 'W-4 line 4c, if you changed it this year')}
            <div>
              <label className="block text-xs font-medium text-gray-600 mb-1">Starting with paycheck ending</label>
              <input type="date" value={inputs.extraFederalStart}
                onChange={(e) => setInputs({ ...inputs, extraFederalStart: e.target.value })}
                className={inputClass} disabled={!inputs.extraFederalPerPaycheck} />
              <p className="text-[11px] text-gray-400 mt-0.5">Leave blank if it starts after this payslip</p>
            </div>
          </div>
          {extraFederal && (
            <p className="text-xs text-gray-600 -mt-2">
              {extraFederal.periodsInYTD > 0 && `Already in YTD on ${extraFederal.periodsInYTD} paycheck(s) (excluded from the regular average). `}
              Adds {fmt(extraFederal.perPaycheck * extraFederal.futurePeriods)} over {extraFederal.futurePeriods} remaining paycheck(s).
            </p>
          )}
          {salaryMissing && (
            <p className="text-xs text-red-600 -mt-2">Enter YTD Salary to project the remaining paychecks.</p>
          )}
          {nonRecurringYTD > 0 && (
            <p className="text-xs text-gray-600 -mt-2">
              Already paid RSUs / bonuses: {fmt(nonRecurringYTD)} (gross − salary), not extrapolated.
            </p>
          )}

          {/* Upcoming RSU vests */}
          <div className="border border-gray-200 rounded bg-white p-3 space-y-2">
            <div className="flex items-center justify-between">
              <h4 className="text-xs font-semibold text-gray-700">
                Upcoming RSU Vests <span className="font-normal text-gray-400">after {after}</span>
              </h4>
              <span className="text-[11px] text-gray-500">
                {inputs.rsuFromGrants ? 'From RSU Grants' : 'Edited'}
                {!inputs.rsuFromGrants && (
                  <button type="button" onClick={() => setInputs({ ...inputs, rsuFromGrants: true, rsuVests: [] })} className="ml-2 text-blue-600">
                    Reset from RSU Grants
                  </button>
                )}
              </span>
            </div>

            {vests.length === 0 ? (
              <p className="text-[11px] text-gray-400">
                {grants.some((g) => g.owner === owner)
                  ? `No ${owner} vests left in ${year} after ${after}.`
                  : `No RSU grants for ${owner}. Import them on the RSU Grants form, or add a vest here.`}
              </p>
            ) : (
              <table className="w-full text-xs">
                <thead>
                  <tr className="text-gray-400">
                    <th className="text-left font-normal">Date</th>
                    <th className="text-right font-normal">Shares</th>
                    <th className="text-right font-normal">Price</th>
                    <th className="text-right font-normal">Value</th>
                    <th />
                  </tr>
                </thead>
                <tbody>
                  {vests.map((v, i) => (
                    <tr key={i}>
                      <td className="pr-2 py-0.5">
                        <input type="date" value={v.date}
                          onChange={(e) => editVests((rows) => rows.map((r, j) => (j === i ? { ...r, date: e.target.value } : r)))}
                          className="border border-gray-200 rounded px-1.5 py-0.5 text-xs" />
                      </td>
                      <td className="px-1 w-24">
                        <input type="number" min={0} value={v.shares || ''}
                          onChange={(e) => editVests((rows) => rows.map((r, j) => (j === i ? { ...r, shares: parseFloat(e.target.value) || 0 } : r)))}
                          className={cellClass} />
                      </td>
                      <td className="px-1 w-24">
                        <input type="number" min={0} step="0.01" value={v.price || ''}
                          onChange={(e) => editVests((rows) => rows.map((r, j) => (j === i ? { ...r, price: parseFloat(e.target.value) || 0 } : r)))}
                          className={cellClass} />
                      </td>
                      <td className="px-1 text-right tabular-nums w-24">{fmt(v.shares * v.price)}</td>
                      <td className="pl-1 w-4">
                        <button type="button" aria-label="Remove vest"
                          onClick={() => editVests((rows) => rows.filter((_, j) => j !== i))}
                          className="text-gray-300 hover:text-red-500">×</button>
                      </td>
                    </tr>
                  ))}
                </tbody>
                <tfoot>
                  <tr className="border-t border-gray-100 font-medium">
                    <td colSpan={3} className="pt-1">Total remaining vests</td>
                    <td className="pt-1 text-right tabular-nums">{fmt(remainingRsuVests)}</td>
                    <td />
                  </tr>
                </tfoot>
              </table>
            )}
            <div className="flex items-center justify-between">
              <button type="button" className="text-[11px] text-blue-600"
                onClick={() => editVests((rows) => [...rows, { date: after, shares: 0, price: vests[0]?.price ?? 0 }])}>
                + Add vest
              </button>
              {unpriced && <span className="text-[11px] text-amber-700">Some vests have no price — set one here or on RSU Grants.</span>}
            </div>
            <p className="text-[11px] text-gray-400">
              Only vests after the payslip date; earlier ones are already in YTD gross. Edits here don't change RSU Grants.
            </p>

            <div className="grid grid-cols-2 gap-3 pt-1">
              <div>
                <label className="block text-xs font-medium text-gray-600 mb-1">Federal withholding on vests</label>
                <div className="relative">
                  <input
                    type="number" step="0.1" min={MIN_SUPPLEMENTAL_RATE * 100} max={MAX_SUPPLEMENTAL_RATE * 100}
                    value={rateText}
                    onChange={(e) => onRateChange(e.target.value)}
                    onBlur={() => { if (!rateValid) setRateText(String(Math.round(inputs.supplementalFederalRate * 1000) / 10)); }}
                    className={`${inputClass} pr-6 ${rateValid ? '' : 'border-red-400'}`}
                  />
                  <span className="absolute right-2 top-1/2 -translate-y-1/2 text-gray-400 text-sm">%</span>
                </div>
                <p className={`text-[11px] mt-0.5 ${rateValid ? 'text-gray-400' : 'text-red-600'}`}>
                  {rateValid
                    ? 'Rate elected with your broker (22–37%). 37% always applies above $1M of supplemental pay.'
                    : 'Enter a rate between 22% and 37%.'}
                </p>
              </div>
            </div>
          </div>

          {projected && (
            <div className="bg-white border border-amber-200 rounded p-3">
              <h4 className="text-xs font-semibold text-gray-700 mb-2">Projected Full-Year Values</h4>
              <div className="grid grid-cols-2 gap-1 text-xs">
                <span className="text-gray-600">Wages (Box 1):</span><span className="font-mono text-right">{fmt(projected.wages)}</span>
                <span className="text-gray-600">Federal Withheld (Box 2):</span><span className="font-mono text-right">{fmt(projected.federalWithheld)}</span>
                <span className="text-gray-600">SS Wages (Box 3):</span><span className="font-mono text-right">{fmt(projected.socialSecurityWages)}</span>
                <span className="text-gray-600">SS Withheld (Box 4):</span><span className="font-mono text-right">{fmt(projected.socialSecurityWithheld)}</span>
                <span className="text-gray-600">Medicare Wages (Box 5):</span><span className="font-mono text-right">{fmt(projected.medicareWages)}</span>
                <span className="text-gray-600">Medicare Withheld (Box 6):</span><span className="font-mono text-right">{fmt(projected.medicareWithheld)}</span>
                <span className="text-gray-600">State Wages (Box 16):</span><span className="font-mono text-right">{fmt(projected.stateWages)}</span>
                <span className="text-gray-600">State Withheld (Box 17):</span><span className="font-mono text-right">{fmt(projected.stateWithheld)}</span>
                <span className="text-gray-600">HSA Employer (Box 12W):</span><span className="font-mono text-right">{fmt(projected.hsaEmployerContribution)}</span>
              </div>
              <button
                type="button"
                onClick={() => onApply({
                  ...projected,
                  ytdProjection: { asOf: inputs.payPeriodEnd, payFrequency: inputs.payFrequency, remainingRsuVests },
                })}
                className="mt-3 w-full px-3 py-1.5 bg-amber-600 text-white text-sm font-medium rounded hover:bg-amber-700"
              >
                Apply to W-2
              </button>
              <p className="text-[11px] text-gray-400 mt-1 text-center">Then click Save to keep the values and inputs.</p>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
