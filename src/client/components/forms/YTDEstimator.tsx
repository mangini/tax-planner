import { useState } from 'react';
import type { YearConfig } from '@shared/types';
import { PAY_FREQUENCIES, payPeriodsCompleted, periodsPerYear, type PayFrequency } from '@shared/pay-periods';
import { projectYTD, type YTDProjection } from '@shared/ytd-projection';

interface YTDInputs {
  payPeriodEnd: string; // YYYY-MM-DD, from the payslip
  payFrequency: PayFrequency;
  ytdGrossPay: number;
  ytdSalary: number;
  ytdPreTaxDeductions: number;
  ytdFederalTax: number;
  ytdStateTax: number;
  ytdOasdi: number;
  ytdMedicare: number;
  ytdHsa: number;
  remainingRsuVests: number;
  supplementalFederalRate: number;
}

type NumericField = Exclude<keyof YTDInputs, 'payPeriodEnd' | 'payFrequency'>;

interface Props {
  config: YearConfig;
  onApply: (values: YTDProjection) => void;
}

const defaultInputs: YTDInputs = {
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
  remainingRsuVests: 0,
  supplementalFederalRate: 0.22,
};

function fmt(n: number): string {
  return n.toLocaleString('en-US', { style: 'currency', currency: 'USD', maximumFractionDigits: 0 });
}

export default function YTDEstimator({ config, onApply }: Props) {
  const [open, setOpen] = useState(false);
  const [inputs, setInputs] = useState<YTDInputs>(defaultInputs);

  const completed = payPeriodsCompleted(inputs.payPeriodEnd, inputs.payFrequency);
  const total = periodsPerYear(inputs.payFrequency);
  const nonRecurringYTD = Math.max(0, inputs.ytdGrossPay - inputs.ytdSalary);
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
          remainingRsuVests: inputs.remainingRsuVests,
          supplementalFederalRate: inputs.supplementalFederalRate,
          supplementalStateRate: config.colorado.flatRate,
          ssWageBase: config.socialSecurity.wageBase,
          ssRate: config.socialSecurity.employeeRate,
          medicareRate: config.socialSecurity.medicareRate,
        })
      : null;

  const set = (field: NumericField, value: string) => {
    setInputs({ ...inputs, [field]: parseFloat(value) || 0 });
  };

  const inputClass = "border border-gray-300 rounded px-2 py-1.5 text-sm w-full";

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
        YTD Estimator
        <span className="text-xs">{open ? '▲' : '▼'}</span>
      </button>

      {open && (
        <div className="px-4 pb-4 space-y-4">
          <p className="text-xs text-amber-700">
            Enter YTD values from your latest payslip. Salary is extrapolated across the remaining
            pay periods; RSU vests and bonuses already paid are kept as-is.
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
          {salaryMissing && (
            <p className="text-xs text-red-600 -mt-2">Enter YTD Salary to project the remaining paychecks.</p>
          )}
          {nonRecurringYTD > 0 && (
            <p className="text-xs text-gray-600 -mt-2">
              Already paid RSUs / bonuses: {fmt(nonRecurringYTD)} (gross − salary), not extrapolated.
            </p>
          )}

          <div className="border border-gray-200 rounded bg-white p-3 space-y-3">
            <h4 className="text-xs font-semibold text-gray-700">Upcoming RSU Vests</h4>
            <div className="grid grid-cols-2 gap-3">
              {money('remainingRsuVests', 'Remaining vests this year ($)', 'Shares × est. price; exclude vests already on payslips')}
              <div>
                <label className="block text-xs font-medium text-gray-600 mb-1">Federal withholding on vests</label>
                <select
                  value={inputs.supplementalFederalRate}
                  onChange={(e) => setInputs({ ...inputs, supplementalFederalRate: parseFloat(e.target.value) })}
                  className={inputClass}
                >
                  <option value={0.22}>22% (default supplemental)</option>
                  <option value={0.37}>37% (elected)</option>
                </select>
                <p className="text-[11px] text-gray-400 mt-0.5">37% always applies above $1M of supplemental pay</p>
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
                onClick={() => onApply(projected)}
                className="mt-3 w-full px-3 py-1.5 bg-amber-600 text-white text-sm font-medium rounded hover:bg-amber-700"
              >
                Apply to W-2
              </button>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
