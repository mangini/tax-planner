import { useState } from 'react';
import type { EstimatedPaymentsData } from '@shared/types';
import MoneyInput from './MoneyInput';
import FormEditor from './FormEditor';

interface Props {
  data: EstimatedPaymentsData | undefined;
  onSave: (data: { estimatedPayments: EstimatedPaymentsData }) => Promise<void>;
}

const defaults: EstimatedPaymentsData = {
  federalQ1: 0, federalQ2: 0, federalQ3: 0, federalQ4: 0,
  stateQ1: 0, stateQ2: 0, stateQ3: 0, stateQ4: 0,
};

export default function EstimatedPaymentsForm({ data, onSave }: Props) {
  const [form, setForm] = useState<EstimatedPaymentsData>(data || defaults);
  const [saving, setSaving] = useState(false);

  const update = (field: keyof EstimatedPaymentsData, value: number) =>
    setForm((f) => ({ ...f, [field]: value }));

  const handleSave = async () => {
    setSaving(true);
    await onSave({ estimatedPayments: form });
    setSaving(false);
  };

  return (
    <FormEditor title="Estimated Tax Payments" onSave={handleSave} saving={saving}>
      <div className="space-y-3">
        <h3 className="text-xs font-medium text-gray-400 uppercase tracking-wide">Federal Estimated Payments</h3>
        <div className="grid grid-cols-4 gap-3">
          <MoneyInput label="Q1" value={form.federalQ1} onChange={(v) => update('federalQ1', v)} />
          <MoneyInput label="Q2" value={form.federalQ2} onChange={(v) => update('federalQ2', v)} />
          <MoneyInput label="Q3" value={form.federalQ3} onChange={(v) => update('federalQ3', v)} />
          <MoneyInput label="Q4" value={form.federalQ4} onChange={(v) => update('federalQ4', v)} />
        </div>
        <h3 className="text-xs font-medium text-gray-400 uppercase tracking-wide pt-1">State Estimated Payments</h3>
        <div className="grid grid-cols-4 gap-3">
          <MoneyInput label="Q1" value={form.stateQ1} onChange={(v) => update('stateQ1', v)} />
          <MoneyInput label="Q2" value={form.stateQ2} onChange={(v) => update('stateQ2', v)} />
          <MoneyInput label="Q3" value={form.stateQ3} onChange={(v) => update('stateQ3', v)} />
          <MoneyInput label="Q4" value={form.stateQ4} onChange={(v) => update('stateQ4', v)} />
        </div>
      </div>
    </FormEditor>
  );
}
