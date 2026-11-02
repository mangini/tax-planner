import { useState, useEffect } from 'react';
import type { YearConfig, TaxBracket } from '@shared/types';

interface Props {
  config: YearConfig | null;
  onSave: (partial: Partial<YearConfig>) => Promise<void>;
  onReset: () => Promise<void>;
}

export default function ConfigPage({ config, onSave, onReset }: Props) {
  const [saving, setSaving] = useState(false);
  const [localConfig, setLocalConfig] = useState<YearConfig | null>(config);

  useEffect(() => {
    setLocalConfig(config);
  }, [config]);

  if (!localConfig) return <p className="text-gray-500">No config loaded.</p>;

  const handleSave = async () => {
    setSaving(true);
    await onSave(localConfig);
    setSaving(false);
  };

  const handleReset = async () => {
    if (confirm('Reset to default values? This will overwrite your changes.')) {
      await onReset();
    }
  };

  const updateBracket = (
    field: 'federalBrackets' | 'ltcgBrackets',
    index: number,
    key: keyof TaxBracket,
    value: string
  ) => {
    setLocalConfig((c) => {
      if (!c) return c;
      const brackets = [...c[field]];
      const stripped = value.replace(/,/g, '');
      const numVal = stripped === '' ? 0 : parseFloat(stripped);
      if (key === 'rate') {
        brackets[index] = { ...brackets[index], rate: numVal / 100 };
      } else if (key === 'max') {
        brackets[index] = { ...brackets[index], max: stripped === '' ? null : numVal };
      } else {
        brackets[index] = { ...brackets[index], [key]: numVal };
      }
      return { ...c, [field]: brackets };
    });
  };

  const set = (updater: (c: YearConfig) => YearConfig) =>
    setLocalConfig((c) => (c ? updater(c) : c));

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-2xl font-bold text-gray-900">Year Config ({localConfig.year})</h1>
        <div className="flex gap-2">
          <button onClick={handleReset} className="px-4 py-2 text-sm text-gray-600 border border-gray-300 rounded hover:bg-gray-50">
            Reset to Defaults
          </button>
          <button onClick={handleSave} disabled={saving}
            className="px-4 py-2 bg-blue-600 text-white text-sm font-medium rounded hover:bg-blue-700 disabled:opacity-50">
            {saving ? 'Saving...' : 'Save'}
          </button>
        </div>
      </div>

      <div className="space-y-6">
        {/* Tax Brackets */}
        <div className="grid grid-cols-2 gap-6">
          <BracketEditor
            title="Federal Income Tax Brackets (MFJ)"
            brackets={localConfig.federalBrackets}
            onChange={(idx, key, val) => updateBracket('federalBrackets', idx, key, val)}
          />
          <BracketEditor
            title="Long-Term Capital Gains Brackets (MFJ)"
            brackets={localConfig.ltcgBrackets}
            onChange={(idx, key, val) => updateBracket('ltcgBrackets', idx, key, val)}
          />
        </div>

        {/* Thresholds — grouped by category */}
        <div className="grid grid-cols-3 gap-6">
          <Section title="Income & Deductions">
            <DollarField label="Standard Deduction" value={localConfig.standardDeduction}
              onChange={(v) => set((c) => ({ ...c, standardDeduction: v }))} />
            <DollarField label="SALT Cap" value={localConfig.salt.cap}
              onChange={(v) => set((c) => ({ ...c, salt: { ...c.salt, cap: v } }))} />
            <DollarField label="SALT Floor" value={localConfig.salt.floor}
              onChange={(v) => set((c) => ({ ...c, salt: { ...c.salt, floor: v } }))} />
            <DollarField label="SALT Phaseout Start" value={localConfig.salt.phaseoutStart ?? 0}
              onChange={(v) => set((c) => ({ ...c, salt: { ...c.salt, phaseoutStart: v || null } }))} />
            <PctField label="Charitable Cash AGI Limit" value={localConfig.charitable.cashAGILimit}
              onChange={(v) => set((c) => ({ ...c, charitable: { ...c.charitable, cashAGILimit: v } }))} />
            <PctField label="Charitable Property AGI Limit" value={localConfig.charitable.propertyAGILimit}
              onChange={(v) => set((c) => ({ ...c, charitable: { ...c.charitable, propertyAGILimit: v } }))} />
            <PctField label="Charitable AGI Floor" value={localConfig.charitable.agiFloorPct}
              onChange={(v) => set((c) => ({ ...c, charitable: { ...c.charitable, agiFloorPct: v } }))} />
            <DollarField label="Non-Itemizer Charitable Max" value={localConfig.charitable.nonItemizerCashMax}
              onChange={(v) => set((c) => ({ ...c, charitable: { ...c.charitable, nonItemizerCashMax: v } }))} />
            <PctField label="Itemized Reduction (37% bracket)" value={localConfig.itemized.topBracketReductionRate}
              onChange={(v) => set((c) => ({ ...c, itemized: { ...c.itemized, topBracketReductionRate: v } }))} />
            <CheckField label="Mortgage Insurance Deductible" value={localConfig.itemized.mortgageInsuranceDeductible}
              onChange={(v) => set((c) => ({ ...c, itemized: { ...c.itemized, mortgageInsuranceDeductible: v } }))} />
            <DollarField label="Capital Loss Limit" value={localConfig.capitalLossLimit}
              onChange={(v) => set((c) => ({ ...c, capitalLossLimit: v }))} />
          </Section>

          <Section title="Credits & AMT">
            <DollarField label="Child Tax Credit" value={localConfig.childTaxCredit.amount}
              onChange={(v) => set((c) => ({ ...c, childTaxCredit: { ...c.childTaxCredit, amount: v } }))} />
            <DollarField label="CTC Phaseout Start" value={localConfig.childTaxCredit.phaseoutStart}
              onChange={(v) => set((c) => ({ ...c, childTaxCredit: { ...c.childTaxCredit, phaseoutStart: v } }))} />
            <DollarField label="AMT Exemption" value={localConfig.amt.exemption}
              onChange={(v) => set((c) => ({ ...c, amt: { ...c.amt, exemption: v } }))} />
            <DollarField label="AMT Phaseout Start" value={localConfig.amt.phaseoutStart}
              onChange={(v) => set((c) => ({ ...c, amt: { ...c.amt, phaseoutStart: v } }))} />
            <PctField label="AMT Phaseout Rate" value={localConfig.amt.phaseoutRate}
              onChange={(v) => set((c) => ({ ...c, amt: { ...c.amt, phaseoutRate: v } }))} />
            <DollarField label="AMT 28% Threshold" value={localConfig.amt.rate26threshold}
              onChange={(v) => set((c) => ({ ...c, amt: { ...c.amt, rate26threshold: v } }))} />
            <DollarField label="AOTC Max" value={localConfig.education.aotcMax}
              onChange={(v) => set((c) => ({ ...c, education: { ...c.education, aotcMax: v } }))} />
            <DollarField label="AOTC Phaseout Start" value={localConfig.education.aotcPhaseoutStart}
              onChange={(v) => set((c) => ({ ...c, education: { ...c.education, aotcPhaseoutStart: v } }))} />
            <DollarField label="AOTC Phaseout End" value={localConfig.education.aotcPhaseoutEnd}
              onChange={(v) => set((c) => ({ ...c, education: { ...c.education, aotcPhaseoutEnd: v } }))} />
          </Section>

          <Section title="Medicare, SS & NIIT">
            <DollarField label="NIIT Threshold" value={localConfig.niit.threshold}
              onChange={(v) => set((c) => ({ ...c, niit: { ...c.niit, threshold: v } }))} />
            <PctField label="NIIT Rate" value={localConfig.niit.rate}
              onChange={(v) => set((c) => ({ ...c, niit: { ...c.niit, rate: v } }))} />
            <DollarField label="Addl Medicare Threshold" value={localConfig.additionalMedicare.threshold}
              onChange={(v) => set((c) => ({ ...c, additionalMedicare: { ...c.additionalMedicare, threshold: v } }))} />
            <PctField label="Addl Medicare Rate" value={localConfig.additionalMedicare.rate}
              onChange={(v) => set((c) => ({ ...c, additionalMedicare: { ...c.additionalMedicare, rate: v } }))} />
            <DollarField label="SS Wage Base" value={localConfig.socialSecurity.wageBase}
              onChange={(v) => set((c) => ({ ...c, socialSecurity: { ...c.socialSecurity, wageBase: v } }))} />
            <PctField label="SS Employee Rate" value={localConfig.socialSecurity.employeeRate}
              onChange={(v) => set((c) => ({ ...c, socialSecurity: { ...c.socialSecurity, employeeRate: v } }))} />
          </Section>
        </div>

        <div className="grid grid-cols-3 gap-6">
          <Section title="HSA">
            <DollarField label="Self-Only Limit" value={localConfig.hsa.selfOnlyLimit}
              onChange={(v) => set((c) => ({ ...c, hsa: { ...c.hsa, selfOnlyLimit: v } }))} />
            <DollarField label="Family Limit" value={localConfig.hsa.familyLimit}
              onChange={(v) => set((c) => ({ ...c, hsa: { ...c.hsa, familyLimit: v } }))} />
            <DollarField label="Catch-Up Amount" value={localConfig.hsa.catchUpAmount}
              onChange={(v) => set((c) => ({ ...c, hsa: { ...c.hsa, catchUpAmount: v } }))} />
            <NumberField label="Catch-Up Age" value={localConfig.hsa.catchUpAge}
              onChange={(v) => set((c) => ({ ...c, hsa: { ...c.hsa, catchUpAge: v } }))} />
          </Section>

          <Section title="FBAR & Form 8938">
            <DollarField label="FBAR Threshold" value={localConfig.fbar.fbarThreshold}
              onChange={(v) => set((c) => ({ ...c, fbar: { ...c.fbar, fbarThreshold: v } }))} />
            <DollarField label="8938 Year-End (Single)" value={localConfig.fbar.form8938YearEnd}
              onChange={(v) => set((c) => ({ ...c, fbar: { ...c.fbar, form8938YearEnd: v } }))} />
            <DollarField label="8938 Year-End (MFJ)" value={localConfig.fbar.form8938YearEndMFJ}
              onChange={(v) => set((c) => ({ ...c, fbar: { ...c.fbar, form8938YearEndMFJ: v } }))} />
            <DollarField label="8938 Any Time (Single)" value={localConfig.fbar.form8938AnyTime}
              onChange={(v) => set((c) => ({ ...c, fbar: { ...c.fbar, form8938AnyTime: v } }))} />
            <DollarField label="8938 Any Time (MFJ)" value={localConfig.fbar.form8938AnyTimeMFJ}
              onChange={(v) => set((c) => ({ ...c, fbar: { ...c.fbar, form8938AnyTimeMFJ: v } }))} />
          </Section>

          <Section title="State">
            <PctField label="Colorado Flat Rate" value={localConfig.colorado.flatRate}
              onChange={(v) => set((c) => ({ ...c, colorado: { ...c.colorado, flatRate: v } }))} />
          </Section>
        </div>
      </div>
    </div>
  );
}

/* ── Helpers ─────────────────────────────────────────── */

/** Format a number with thousand separators (no decimals) */
function fmtNum(n: number): string {
  return n.toLocaleString('en-US', { maximumFractionDigits: 0 });
}

/** Parse a string that may contain commas back to a number */
function parseNum(s: string): number {
  return parseFloat(s.replace(/,/g, '')) || 0;
}

/* ── Reusable pieces ────────────────────────────────── */

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div className="bg-white rounded-lg border border-gray-200 p-5">
      <h2 className="text-sm font-semibold text-gray-900 uppercase tracking-wide mb-3">{title}</h2>
      <div className="space-y-2">{children}</div>
    </div>
  );
}

function DollarField({ label, value, onChange }: { label: string; value: number; onChange: (v: number) => void }) {
  const [focused, setFocused] = useState(false);
  const [raw, setRaw] = useState(String(value));

  useEffect(() => {
    if (!focused) setRaw(String(value));
  }, [value, focused]);

  return (
    <div className="flex items-center justify-between gap-3">
      <label className="text-sm text-gray-600 whitespace-nowrap">{label}</label>
      <div className="relative">
        <span className="absolute left-2 top-1/2 -translate-y-1/2 text-gray-400 text-sm">$</span>
        <input
          type="text"
          inputMode="numeric"
          value={focused ? raw : fmtNum(value)}
          onFocus={(e) => { setFocused(true); setRaw(String(value)); e.target.select(); }}
          onBlur={() => { setFocused(false); onChange(parseNum(raw)); }}
          onChange={(e) => { setRaw(e.target.value); onChange(parseNum(e.target.value)); }}
          className="w-32 border border-gray-300 rounded px-2 py-1 pl-5 text-sm text-right tabular-nums"
        />
      </div>
    </div>
  );
}

function NumberField({ label, value, onChange }: { label: string; value: number; onChange: (v: number) => void }) {
  return (
    <div className="flex items-center justify-between gap-3">
      <label className="text-sm text-gray-600 whitespace-nowrap">{label}</label>
      <input type="number" value={value} onChange={(e) => onChange(parseFloat(e.target.value) || 0)}
        className="w-32 border border-gray-300 rounded px-2 py-1 text-sm text-right tabular-nums" />
    </div>
  );
}

function CheckField({ label, value, onChange }: { label: string; value: boolean; onChange: (v: boolean) => void }) {
  return (
    <div className="flex items-center justify-between gap-3">
      <label className="text-sm text-gray-600 whitespace-nowrap">{label}</label>
      <input type="checkbox" checked={value} onChange={(e) => onChange(e.target.checked)} className="h-4 w-4" />
    </div>
  );
}

function PctField({ label, value, onChange }: { label: string; value: number; onChange: (v: number) => void }) {
  return (
    <div className="flex items-center justify-between gap-3">
      <label className="text-sm text-gray-600 whitespace-nowrap">{label}</label>
      <div className="relative">
        <input type="number" step="0.01" value={(value * 100).toFixed(2)}
          onChange={(e) => onChange((parseFloat(e.target.value) || 0) / 100)}
          className="w-32 border border-gray-300 rounded px-2 py-1 text-sm text-right tabular-nums pr-6" />
        <span className="absolute right-2 top-1/2 -translate-y-1/2 text-gray-400 text-sm">%</span>
      </div>
    </div>
  );
}

function BracketDollarInput({ value, placeholder, onChange }: { value: number | null; placeholder?: string; onChange: (v: string) => void }) {
  const [focused, setFocused] = useState(false);
  const [raw, setRaw] = useState(value != null ? String(value) : '');

  useEffect(() => {
    if (!focused) setRaw(value != null ? String(value) : '');
  }, [value, focused]);

  return (
    <input
      type="text"
      inputMode="numeric"
      placeholder={placeholder}
      value={focused ? raw : (value != null ? fmtNum(value) : '')}
      onFocus={(e) => { setFocused(true); setRaw(value != null ? String(value) : ''); e.target.select(); }}
      onBlur={() => { setFocused(false); onChange(raw); }}
      onChange={(e) => { setRaw(e.target.value); onChange(e.target.value); }}
      className="border border-gray-300 rounded px-2 py-1 text-sm w-full text-right tabular-nums"
    />
  );
}

function BracketEditor({
  title,
  brackets,
  onChange,
}: {
  title: string;
  brackets: TaxBracket[];
  onChange: (index: number, key: keyof TaxBracket, value: string) => void;
}) {
  return (
    <div className="bg-white rounded-lg border border-gray-200 p-5">
      <h2 className="text-sm font-semibold text-gray-900 uppercase tracking-wide mb-3">{title}</h2>
      <table className="w-full text-sm">
        <thead>
          <tr className="text-gray-500 text-xs uppercase tracking-wide">
            <th className="text-left pb-2 font-medium">From</th>
            <th className="text-left pb-2 font-medium">To</th>
            <th className="text-right pb-2 font-medium">Rate</th>
          </tr>
        </thead>
        <tbody>
          {brackets.map((b, i) => (
            <tr key={i} className="border-t border-gray-100">
              <td className="py-1.5 pr-2">
                <BracketDollarInput value={b.min} onChange={(v) => onChange(i, 'min', v)} />
              </td>
              <td className="py-1.5 pr-2">
                <BracketDollarInput value={b.max} placeholder="—" onChange={(v) => onChange(i, 'max', v)} />
              </td>
              <td className="py-1.5">
                <div className="relative">
                  <input type="number" step="0.01" value={(b.rate * 100).toFixed(2)}
                    onChange={(e) => onChange(i, 'rate', e.target.value)}
                    className="border border-gray-300 rounded px-2 py-1 text-sm w-full text-right tabular-nums pr-6" />
                  <span className="absolute right-2 top-1/2 -translate-y-1/2 text-gray-400 text-xs">%</span>
                </div>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
