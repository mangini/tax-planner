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
      <div className={`rounded-lg overflow-hidden border ${form.isEstimate ? 'border-amber-200 bg-amber-50/20' : 'border-gray-100'}`}>
        <div className={`flex items-center justify-end px-4 py-2.5 ${form.isEstimate ? 'bg-amber-50/60' : 'bg-gray-50'}`}>
          <EstimateToggle isEstimate={!!form.isEstimate} onChange={(v) => setForm({ ...form, isEstimate: v })} />
        </div>
        <div className="px-4 py-3">
          <div className="grid grid-cols-2 gap-3">
            <MoneyInput label="Cash Donations" value={form.cashDonations} estimated={form.isEstimate} onChange={(v) => setForm({ ...form, cashDonations: v })} />
            <MoneyInput label="Property Donations" value={form.propertyDonations} estimated={form.isEstimate} onChange={(v) => setForm({ ...form, propertyDonations: v })} />
          </div>
        </div>
      </div>
    </FormEditor>
  );
}
