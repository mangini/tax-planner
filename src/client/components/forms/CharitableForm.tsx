import { useState } from 'react';
import type { CharitableData } from '@shared/types';
import MoneyInput from './MoneyInput';
import EstimateToggle from './EstimateToggle';
import FormEditor from './FormEditor';

interface Props {
  data: CharitableData | undefined;
  onSave: (data: { charitable: CharitableData }) => Promise<void>;
}

const defaults: CharitableData = { cashDonations: 0, propertyDonations: 0 };

export default function CharitableForm({ data, onSave }: Props) {
  const [form, setForm] = useState<CharitableData>(data || defaults);
  const [saving, setSaving] = useState(false);

  const handleSave = async () => {
    setSaving(true);
    await onSave({ charitable: form });
    setSaving(false);
  };

  return (
    <FormEditor title="Charitable Contributions" onSave={handleSave} saving={saving}>
      <div className={`border rounded p-4 ${form.isEstimate ? 'border-amber-300 bg-amber-50/30' : 'border-gray-200'}`}>
        <div className="flex justify-end mb-3">
          <EstimateToggle isEstimate={!!form.isEstimate} onChange={(v) => setForm({ ...form, isEstimate: v })} />
        </div>
        <div className="grid grid-cols-2 gap-4">
          <MoneyInput label="Cash Donations" value={form.cashDonations} estimated={form.isEstimate} onChange={(v) => setForm({ ...form, cashDonations: v })} />
          <MoneyInput label="Property Donations" value={form.propertyDonations} estimated={form.isEstimate} onChange={(v) => setForm({ ...form, propertyDonations: v })} />
        </div>
      </div>
    </FormEditor>
  );
}
