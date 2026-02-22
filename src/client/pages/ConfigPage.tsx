import { useState, useEffect } from 'react';
import type { YearConfig, TaxBracket } from '@shared/types';

interface Props {
  config: YearConfig | null;
  onSave: (partial: Partial<YearConfig>) => Promise<void>;
  onReset: () => Promise<void>;
}

function fmt(n: number): string {
  return n.toLocaleString('en-US');
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
      const numVal = value === '' ? 0 : parseFloat(value);
      if (key === 'rate') {
        brackets[index] = { ...brackets[index], rate: numVal / 100 };
      } else if (key === 'max') {
        brackets[index] = { ...brackets[index], max: value === '' ? null : numVal };
      } else {
        brackets[index] = { ...brackets[index], [key]: numVal };
      }
      return { ...c, [field]: brackets };
    });
  };

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

        <div className="bg-white rounded-lg border border-gray-200 p-6">
          <h2 className="text-lg font-semibold text-gray-900 mb-4">Key Thresholds</h2>
          <div className="grid grid-cols-2 gap-4 text-sm">
            <ConfigField label="Standard Deduction" value={localConfig.standardDeduction}
              onChange={(v) => setLocalConfig({ ...localConfig, standardDeduction: v })} />
            <ConfigField label="SALT Cap" value={localConfig.salt.cap}
              onChange={(v) => setLocalConfig({ ...localConfig, salt: { ...localConfig.salt, cap: v } })} />
            <ConfigField label="AMT Exemption" value={localConfig.amt.exemption}
              onChange={(v) => setLocalConfig({ ...localConfig, amt: { ...localConfig.amt, exemption: v } })} />
            <ConfigField label="NIIT Threshold" value={localConfig.niit.threshold}
              onChange={(v) => setLocalConfig({ ...localConfig, niit: { ...localConfig.niit, threshold: v } })} />
            <ConfigField label="SS Wage Base" value={localConfig.socialSecurity.wageBase}
              onChange={(v) => setLocalConfig({ ...localConfig, socialSecurity: { ...localConfig.socialSecurity, wageBase: v } })} />
            <ConfigField label="Child Tax Credit" value={localConfig.childTaxCredit.amount}
              onChange={(v) => setLocalConfig({ ...localConfig, childTaxCredit: { ...localConfig.childTaxCredit, amount: v } })} />
            <ConfigField label="HSA Family Limit" value={localConfig.hsa.familyLimit}
              onChange={(v) => setLocalConfig({ ...localConfig, hsa: { ...localConfig.hsa, familyLimit: v } })} />
            <ConfigFieldPct label="Colorado Rate" value={localConfig.colorado.flatRate}
              onChange={(v) => setLocalConfig({ ...localConfig, colorado: { ...localConfig.colorado, flatRate: v } })} />
          </div>
        </div>
      </div>
    </div>
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
    <div className="bg-white rounded-lg border border-gray-200 p-6">
      <h2 className="text-lg font-semibold text-gray-900 mb-4">{title}</h2>
      <table className="w-full text-sm">
        <thead>
          <tr className="text-gray-500">
            <th className="text-left pb-2">From</th>
            <th className="text-left pb-2">To</th>
            <th className="text-left pb-2">Rate</th>
          </tr>
        </thead>
        <tbody>
          {brackets.map((b, i) => (
            <tr key={i}>
              <td className="py-1 pr-2">
                <input type="number" value={b.min} onChange={(e) => onChange(i, 'min', e.target.value)}
                  className="border border-gray-300 rounded px-2 py-1 text-sm w-full" />
              </td>
              <td className="py-1 pr-2">
                <input type="number" value={b.max ?? ''} placeholder="No limit"
                  onChange={(e) => onChange(i, 'max', e.target.value)}
                  className="border border-gray-300 rounded px-2 py-1 text-sm w-full" />
              </td>
              <td className="py-1">
                <div className="flex items-center">
                  <input type="number" step="0.01" value={(b.rate * 100).toFixed(2)}
                    onChange={(e) => onChange(i, 'rate', e.target.value)}
                    className="border border-gray-300 rounded px-2 py-1 text-sm w-20" />
                  <span className="ml-1 text-gray-500">%</span>
                </div>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

function ConfigField({ label, value, onChange }: { label: string; value: number; onChange: (v: number) => void }) {
  return (
    <div>
      <label className="block text-sm font-medium text-gray-700 mb-1">{label}</label>
      <div className="relative">
        <span className="absolute left-2 top-1/2 -translate-y-1/2 text-gray-400 text-sm">$</span>
        <input type="number" value={value} onChange={(e) => onChange(parseFloat(e.target.value) || 0)}
          className="w-full border border-gray-300 rounded px-2 py-1.5 pl-6 text-sm" />
      </div>
    </div>
  );
}

function ConfigFieldPct({ label, value, onChange }: { label: string; value: number; onChange: (v: number) => void }) {
  return (
    <div>
      <label className="block text-sm font-medium text-gray-700 mb-1">{label}</label>
      <div className="flex items-center">
        <input type="number" step="0.01" value={(value * 100).toFixed(2)}
          onChange={(e) => onChange((parseFloat(e.target.value) || 0) / 100)}
          className="border border-gray-300 rounded px-2 py-1.5 text-sm w-24" />
        <span className="ml-1 text-gray-500">%</span>
      </div>
    </div>
  );
}
