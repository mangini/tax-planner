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
      <div className={`border rounded p-4 ${form.isEstimate ? 'border-amber-300 bg-amber-50/30' : 'border-gray-200'}`}>
        <div className="flex justify-end mb-3">
          <EstimateToggle isEstimate={!!form.isEstimate} onChange={(v) => setForm({ ...form, isEstimate: v })} />
        </div>
        <div className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <MoneyInput label="Your Contribution" value={form.selfContribution} estimated={form.isEstimate} onChange={(v) => setForm({ ...form, selfContribution: v })} />
            <MoneyInput label="Employer Contribution" value={form.employerContribution} estimated={form.isEstimate} onChange={(v) => setForm({ ...form, employerContribution: v })} />
          </div>
          <div className="grid grid-cols-3 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Coverage</label>
              <select value={form.coverageType} onChange={(e) => setForm({ ...form, coverageType: e.target.value as 'self-only' | 'family' })}
                className="border border-gray-300 rounded px-3 py-1.5 text-sm w-full">
                <option value="self-only">Self-only</option>
                <option value="family">Family</option>
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Your Age</label>
              <input type="number" value={form.selfAge} onChange={(e) => setForm({ ...form, selfAge: parseInt(e.target.value) || 0 })}
                className="border border-gray-300 rounded px-3 py-1.5 text-sm w-full" />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Spouse Age</label>
              <input type="number" value={form.spouseAge} onChange={(e) => setForm({ ...form, spouseAge: parseInt(e.target.value) || 0 })}
                className="border border-gray-300 rounded px-3 py-1.5 text-sm w-full" />
            </div>
          </div>
        </div>
      </div>
    </FormEditor>
  );
}
