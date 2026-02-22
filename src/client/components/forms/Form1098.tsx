import { useState } from 'react';
import { v4 as uuid } from 'uuid';
import type { Form1098Data } from '@shared/types';
import MoneyInput from './MoneyInput';
import EstimateToggle from './EstimateToggle';
import FormEditor from './FormEditor';

interface Props {
  data: Form1098Data[];
  onSave: (data: { form1098: Form1098Data[] }) => Promise<void>;
}

const newForm = (): Form1098Data => ({ id: uuid(), lender: '', mortgageInterest: 0, propertyTax: 0, pmi: 0 });

export default function Form1098({ data, onSave }: Props) {
  const [forms, setForms] = useState<Form1098Data[]>(data);
  const [saving, setSaving] = useState(false);

  const add = () => setForms([...forms, newForm()]);
  const remove = (id: string) => setForms(forms.filter((f) => f.id !== id));
  const update = (id: string, field: string, value: any) =>
    setForms(forms.map((f) => (f.id === id ? { ...f, [field]: value } : f)));

  const handleSave = async () => {
    setSaving(true);
    await onSave({ form1098: forms });
    setSaving(false);
  };

  return (
    <FormEditor title="1098 Mortgage Interest" onSave={handleSave} saving={saving}>
      {forms.length === 0 && <p className="text-gray-500 text-sm">No 1098 forms.</p>}
      {forms.map((f) => (
        <div key={f.id} className={`rounded-lg mb-3 overflow-hidden border ${f.isEstimate ? 'border-amber-200 bg-amber-50/20' : 'border-gray-100'}`}>
          <div className={`flex items-center gap-2 px-4 py-2.5 ${f.isEstimate ? 'bg-amber-50/60' : 'bg-gray-50'}`}>
            <input type="text" placeholder="Lender" value={f.lender}
              onChange={(e) => update(f.id, 'lender', e.target.value)}
              className="border border-gray-200 rounded px-3 py-1 text-sm flex-1 bg-white/80" />
            <EstimateToggle isEstimate={!!f.isEstimate} onChange={(v) => update(f.id, 'isEstimate', v)} />
            <button onClick={() => remove(f.id)} className="text-red-400 hover:text-red-600 text-xs">Remove</button>
          </div>
          <div className="px-4 py-3">
            <div className="grid grid-cols-3 gap-3">
              <MoneyInput label="1: Mortgage Interest" value={f.mortgageInterest} estimated={f.isEstimate} onChange={(v) => update(f.id, 'mortgageInterest', v)} />
              <MoneyInput label="Property Tax" value={f.propertyTax} estimated={f.isEstimate} onChange={(v) => update(f.id, 'propertyTax', v)} />
              <MoneyInput label="5: PMI" value={f.pmi} estimated={f.isEstimate} onChange={(v) => update(f.id, 'pmi', v)} />
            </div>
          </div>
        </div>
      ))}
      <button onClick={add} className="text-blue-600 hover:text-blue-700 text-sm font-medium">+ Add 1098</button>
    </FormEditor>
  );
}
