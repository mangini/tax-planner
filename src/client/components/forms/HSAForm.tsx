import { useState } from 'react';
import type { HSAData } from '@shared/types';
import MoneyInput from './MoneyInput';
import EstimateToggle from './EstimateToggle';
import FormEditor from './FormEditor';

interface Props {
  data: HSAData | undefined;
  onSave: (data: { hsa: HSAData }) => Promise<void>;
}

const defaults: HSAData = { selfContribution: 0, employerContribution: 0, coverageType: 'family', selfAge: 30, spouseAge: 30 };

export default function HSAForm({ data, onSave }: Props) {
  const [form, setForm] = useState<HSAData>(data || defaults);
  const [saving, setSaving] = useState(false);

  const handleSave = async () => {
    setSaving(true);
    await onSave({ hsa: form });
    setSaving(false);
  };

  return (
    <FormEditor title="HSA (Health Savings Account)" onSave={handleSave} saving={saving}>
      <div className={`rounded-lg overflow-hidden border ${form.isEstimate ? 'border-amber-200 bg-amber-50/20' : 'border-gray-100'}`}>
        <div className={`flex items-center justify-end px-4 py-2.5 ${form.isEstimate ? 'bg-amber-50/60' : 'bg-gray-50'}`}>
          <EstimateToggle isEstimate={!!form.isEstimate} onChange={(v) => setForm({ ...form, isEstimate: v })} />
        </div>
        <div className="px-4 py-3">
          <div className="grid grid-cols-5 gap-3">
            <MoneyInput label="Your Contribution" value={form.selfContribution} estimated={form.isEstimate} onChange={(v) => setForm({ ...form, selfContribution: v })} />
            <MoneyInput label="Employer Contribution" value={form.employerContribution} estimated={form.isEstimate} onChange={(v) => setForm({ ...form, employerContribution: v })} />
            <div>
              <label className="block text-xs text-gray-400 mb-0.5">Coverage</label>
              <select value={form.coverageType} onChange={(e) => setForm({ ...form, coverageType: e.target.value as 'self-only' | 'family' })}
                className="border border-gray-200 rounded px-3 py-1 text-sm w-full">
                <option value="self-only">Self-only</option>
                <option value="family">Family</option>
              </select>
            </div>
            <div>
              <label className="block text-xs text-gray-400 mb-0.5">Your Age</label>
              <input type="number" value={form.selfAge} onChange={(e) => setForm({ ...form, selfAge: parseInt(e.target.value) || 0 })}
                className="border border-gray-200 rounded px-3 py-1 text-sm w-full" />
            </div>
            <div>
              <label className="block text-xs text-gray-400 mb-0.5">Spouse Age</label>
              <input type="number" value={form.spouseAge} onChange={(e) => setForm({ ...form, spouseAge: parseInt(e.target.value) || 0 })}
                className="border border-gray-200 rounded px-3 py-1 text-sm w-full" />
            </div>
          </div>
        </div>
      </div>
    </FormEditor>
  );
}
