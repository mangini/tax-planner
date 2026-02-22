import { useState } from 'react';
import { v4 as uuid } from 'uuid';
import type { Form1099GData } from '@shared/types';
import MoneyInput from './MoneyInput';
import OwnerSelect from './OwnerSelect';
import EstimateToggle from './EstimateToggle';
import FormEditor from './FormEditor';

interface Props {
  data: Form1099GData[];
  onSave: (data: { form1099G: Form1099GData[] }) => Promise<void>;
}

const newForm = (): Form1099GData => ({ id: uuid(), owner: 'self', state: '', stateRefund: 0, priorYearItemized: false });

export default function Form1099G({ data, onSave }: Props) {
  const [forms, setForms] = useState<Form1099GData[]>(data);
  const [saving, setSaving] = useState(false);

  const add = () => setForms([...forms, newForm()]);
  const remove = (id: string) => setForms(forms.filter((f) => f.id !== id));
  const update = (id: string, field: string, value: any) =>
    setForms(forms.map((f) => (f.id === id ? { ...f, [field]: value } : f)));

  const handleSave = async () => {
    setSaving(true);
    await onSave({ form1099G: forms });
    setSaving(false);
  };

  return (
    <FormEditor title="1099-G State Tax Refund" onSave={handleSave} saving={saving}>
      {forms.length === 0 && <p className="text-gray-500 text-sm">No 1099-G forms.</p>}
      {forms.map((f) => (
        <div key={f.id} className={`rounded-lg mb-3 overflow-hidden border ${f.isEstimate ? 'border-amber-200 bg-amber-50/20' : 'border-gray-100'}`}>
          <div className={`flex items-center gap-2 px-4 py-2.5 ${f.isEstimate ? 'bg-amber-50/60' : 'bg-gray-50'}`}>
            <OwnerSelect value={f.owner} onChange={(v) => update(f.id, 'owner', v)} />
            <input type="text" placeholder="State" value={f.state}
              onChange={(e) => update(f.id, 'state', e.target.value)}
              className="border border-gray-200 rounded px-3 py-1 text-sm w-32 bg-white/80" />
            <div className="flex-1" />
            <EstimateToggle isEstimate={!!f.isEstimate} onChange={(v) => update(f.id, 'isEstimate', v)} />
            <button onClick={() => remove(f.id)} className="text-red-400 hover:text-red-600 text-xs">Remove</button>
          </div>
          <div className="px-4 py-3 space-y-2">
            <MoneyInput label="State Refund" value={f.stateRefund} estimated={f.isEstimate} onChange={(v) => update(f.id, 'stateRefund', v)} />
            <label className="flex items-center gap-2 text-sm text-gray-500">
              <input type="checkbox" checked={f.priorYearItemized}
                onChange={(e) => update(f.id, 'priorYearItemized', e.target.checked)} />
              Itemized deductions in prior year (makes refund taxable)
            </label>
          </div>
        </div>
      ))}
      <button onClick={add} className="text-blue-600 hover:text-blue-700 text-sm font-medium">+ Add 1099-G</button>
    </FormEditor>
  );
}
