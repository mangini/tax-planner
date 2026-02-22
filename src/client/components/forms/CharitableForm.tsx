import { useState } from 'react';
import type { CharitableData, CharitableDonation } from '@shared/types';
import MoneyInput from './MoneyInput';
import EstimateToggle from './EstimateToggle';
import FormEditor from './FormEditor';

interface Props {
  data: CharitableData | undefined;
  onSave: (data: { charitable: CharitableData }) => Promise<void>;
}

const defaults: CharitableData = { donations: [] };

const newDonation = (): CharitableDonation => ({
  description: '',
  amount: 0,
  type: 'cash',
});

export default function CharitableForm({ data, onSave }: Props) {
  const [form, setForm] = useState<CharitableData>(data || defaults);
  const [saving, setSaving] = useState(false);

  const add = () => setForm({ ...form, donations: [...form.donations, newDonation()] });
  const remove = (i: number) => setForm({ ...form, donations: form.donations.filter((_, idx) => idx !== i) });
  const update = (i: number, patch: Partial<CharitableDonation>) =>
    setForm({ ...form, donations: form.donations.map((d, idx) => (idx === i ? { ...d, ...patch } : d)) });

  const handleSave = async () => {
    setSaving(true);
    await onSave({ charitable: form });
    setSaving(false);
  };

  return (
    <FormEditor title="Charitable Contributions" onSave={handleSave} saving={saving}>
      <div className={`rounded-lg overflow-hidden border ${form.isEstimate ? 'border-amber-200 bg-amber-50/20' : 'border-gray-100'}`}>
        <div className={`flex items-center justify-end px-4 py-2.5 ${form.isEstimate ? 'bg-amber-50/60' : 'bg-gray-50'}`}>
          <EstimateToggle isEstimate={!!form.isEstimate} onChange={(v) => setForm({ ...form, isEstimate: v })} />
        </div>
        <div className="px-4 py-3 space-y-2">
          {form.donations.length === 0 && (
            <p className="text-gray-500 text-sm">No donations. Click "+ Add donation" to create one.</p>
          )}
          {form.donations.map((d, i) => (
            <div key={i} className="flex items-end gap-2">
              <div className="flex-1">
                <label className="block text-xs text-gray-400 mb-1">Description</label>
                <input
                  type="text"
                  placeholder="e.g. United Way"
                  value={d.description}
                  onChange={(e) => update(i, { description: e.target.value })}
                  className="border border-gray-200 rounded px-3 py-1.5 text-sm w-full bg-white/80"
                />
              </div>
              <div className="w-36">
                <MoneyInput label="Amount" value={d.amount} estimated={form.isEstimate} onChange={(v) => update(i, { amount: v })} />
              </div>
              <div>
                <label className="block text-xs text-gray-400 mb-1">Type</label>
                <select
                  value={d.type}
                  onChange={(e) => update(i, { type: e.target.value as 'cash' | 'property' })}
                  className="border border-gray-200 rounded px-2 py-1.5 text-sm bg-white/80"
                >
                  <option value="cash">Cash</option>
                  <option value="property">Property</option>
                </select>
              </div>
              <button onClick={() => remove(i)} className="text-red-400 hover:text-red-600 text-xs pb-1.5">Remove</button>
            </div>
          ))}
          <button onClick={add} className="text-blue-600 hover:text-blue-700 text-sm font-medium mt-2">+ Add donation</button>
        </div>
      </div>
    </FormEditor>
  );
}
