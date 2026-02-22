import { useState } from 'react';

interface YTDInputs {
  payPeriodsCompleted: number;
  totalPayPeriods: number;
  ytdGrossPay: number;
  ytdPreTaxDeductions: number;
  ytdFederalTax: number;
  ytdStateTax: number;
  ytdOasdi: number;
  ytdMedicare: number;
  ytdHsa: number;
}

interface ProjectedValues {
  wages: number;
  federalWithheld: number;
  socialSecurityWages: number;
  socialSecurityWithheld: number;
  medicareWages: number;
  medicareWithheld: number;
  stateWages: number;
  stateWithheld: number;
  hsaEmployerContribution: number;
}

interface Props {
  onApply: (values: ProjectedValues) => void;
}

const defaultInputs: YTDInputs = {
  payPeriodsCompleted: 0,
  totalPayPeriods: 24,
  ytdGrossPay: 0,
  ytdPreTaxDeductions: 0,
  ytdFederalTax: 0,
  ytdStateTax: 0,
  ytdOasdi: 0,
  ytdMedicare: 0,
  ytdHsa: 0,
};

function round2(n: number): number {
  return Math.round(n * 100) / 100;
}

function project(inputs: YTDInputs): ProjectedValues | null {
  if (inputs.payPeriodsCompleted <= 0 || inputs.totalPayPeriods <= 0) return null;
  const factor = inputs.totalPayPeriods / inputs.payPeriodsCompleted;
  return {
    wages: round2((inputs.ytdGrossPay - inputs.ytdPreTaxDeductions) * factor),
    federalWithheld: round2(inputs.ytdFederalTax * factor),
    socialSecurityWages: round2(inputs.ytdGrossPay * factor),
    socialSecurityWithheld: round2(inputs.ytdOasdi * factor),
    medicareWages: round2(inputs.ytdGrossPay * factor),
    medicareWithheld: round2(inputs.ytdMedicare * factor),
    stateWages: round2((inputs.ytdGrossPay - inputs.ytdPreTaxDeductions) * factor),
    stateWithheld: round2(inputs.ytdStateTax * factor),
    hsaEmployerContribution: round2(inputs.ytdHsa * factor),
  };
}

function fmt(n: number): string {
  return n.toLocaleString('en-US', { style: 'currency', currency: 'USD', maximumFractionDigits: 0 });
}

export default function YTDEstimator({ onApply }: Props) {
  const [open, setOpen] = useState(false);
  const [inputs, setInputs] = useState<YTDInputs>(defaultInputs);

  const projected = project(inputs);

  const set = (field: keyof YTDInputs, value: string) => {
    setInputs({ ...inputs, [field]: parseFloat(value) || 0 });
  };

  const inputClass = "border border-gray-300 rounded px-2 py-1.5 text-sm w-full";

  return (
    <div className="mb-4 border border-amber-200 rounded bg-amber-50/50">
      <button
        type="button"
        onClick={() => setOpen(!open)}
        className="w-full px-4 py-2 text-left text-sm font-medium text-amber-800 hover:bg-amber-100/50 flex justify-between items-center"
      >
        YTD Estimator
        <span className="text-xs">{open ? '\u25B2' : '\u25BC'}</span>
      </button>

      {open && (
        <div className="px-4 pb-4 space-y-4">
          <p className="text-xs text-amber-700">
            Enter your year-to-date paycheck values to extrapolate full-year W-2 amounts.
          </p>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-medium text-gray-600 mb-1">Pay periods completed</label>
              <input type="number" value={inputs.payPeriodsCompleted || ''} onChange={(e) => set('payPeriodsCompleted', e.target.value)} className={inputClass} />
            </div>
            <div>
              <label className="block text-xs font-medium text-gray-600 mb-1">Total pay periods</label>
              <input type="number" value={inputs.totalPayPeriods || ''} onChange={(e) => set('totalPayPeriods', e.target.value)} className={inputClass} />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-medium text-gray-600 mb-1">YTD Gross Pay</label>
              <input type="number" step="0.01" value={inputs.ytdGrossPay || ''} onChange={(e) => set('ytdGrossPay', e.target.value)} className={inputClass} />
            </div>
            <div>
              <label className="block text-xs font-medium text-gray-600 mb-1">YTD Pre-Tax Deductions</label>
              <input type="number" step="0.01" value={inputs.ytdPreTaxDeductions || ''} onChange={(e) => set('ytdPreTaxDeductions', e.target.value)} className={inputClass} />
            </div>
            <div>
              <label className="block text-xs font-medium text-gray-600 mb-1">YTD Federal Tax</label>
              <input type="number" step="0.01" value={inputs.ytdFederalTax || ''} onChange={(e) => set('ytdFederalTax', e.target.value)} className={inputClass} />
            </div>
            <div>
              <label className="block text-xs font-medium text-gray-600 mb-1">YTD State Tax</label>
              <input type="number" step="0.01" value={inputs.ytdStateTax || ''} onChange={(e) => set('ytdStateTax', e.target.value)} className={inputClass} />
            </div>
            <div>
              <label className="block text-xs font-medium text-gray-600 mb-1">YTD OASDI (Social Security)</label>
              <input type="number" step="0.01" value={inputs.ytdOasdi || ''} onChange={(e) => set('ytdOasdi', e.target.value)} className={inputClass} />
            </div>
            <div>
              <label className="block text-xs font-medium text-gray-600 mb-1">YTD Medicare</label>
              <input type="number" step="0.01" value={inputs.ytdMedicare || ''} onChange={(e) => set('ytdMedicare', e.target.value)} className={inputClass} />
            </div>
            <div>
              <label className="block text-xs font-medium text-gray-600 mb-1">YTD HSA (Employer)</label>
              <input type="number" step="0.01" value={inputs.ytdHsa || ''} onChange={(e) => set('ytdHsa', e.target.value)} className={inputClass} />
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
