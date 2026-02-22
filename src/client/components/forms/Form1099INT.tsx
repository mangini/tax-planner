import { useState } from 'react';
import { v4 as uuid } from 'uuid';
import type { Form1099INTData } from '@shared/types';
import MoneyInput from './MoneyInput';
import OwnerSelect from './OwnerSelect';
import EstimateToggle from './EstimateToggle';
import FormEditor from './FormEditor';

interface Props {
  data: Form1099INTData[];
  onSave: (data: { form1099INT: Form1099INTData[] }) => Promise<void>;
}

export default function Form1099INT({ data, onSave }: Props) {
  const [forms, setForms] = useState<Form1099INTData[]>(data);
  const [saving, setSaving] = useState(false);

  const add = () => setForms([...forms, { id: uuid(), owner: 'self', payer: '', interest: 0, isForeign: false, foreignTaxPaid: 0 }]);
  const remove = (id: string) => setForms(forms.filter((f) => f.id !== id));
  const update = (id: string, field: string, value: any) =>
    setForms(forms.map((f) => (f.id === id ? { ...f, [field]: value } : f)));

  const handleSave = async () => {
    setSaving(true);
    await onSave({ form1099INT: forms });
    setSaving(false);
  };

  return (
    <FormEditor title="1099-INT Interest Income" onSave={handleSave} saving={saving}>
      {forms.length === 0 && <p className="text-gray-500 text-sm">No 1099-INT forms. Click "Add" to create one.</p>}
      {forms.map((f) => (
        <div key={f.id} className={`rounded-lg mb-3 overflow-hidden border ${f.isEstimate ? 'border-amber-200 bg-amber-50/20' : 'border-gray-100'}`}>
          <div className={`flex items-center gap-2 px-4 py-2.5 ${f.isEstimate ? 'bg-amber-50/60' : 'bg-gray-50'}`}>
            <OwnerSelect value={f.owner} onChange={(v) => update(f.id, 'owner', v)} />
            <input
              type="text"
              placeholder="Payer name"
              value={f.payer}
              onChange={(e) => update(f.id, 'payer', e.target.value)}
              className="border border-gray-200 rounded px-3 py-1 text-sm flex-1 bg-white/80"
            />
            <EstimateToggle isEstimate={!!f.isEstimate} onChange={(v) => update(f.id, 'isEstimate', v)} />
            <button onClick={() => remove(f.id)} className="text-red-400 hover:text-red-600 text-xs">Remove</button>
          </div>
          <div className="px-4 py-3 space-y-2">
            <div className="grid grid-cols-2 gap-3">
              <MoneyInput label="Interest" value={f.interest} estimated={f.isEstimate} onChange={(v) => update(f.id, 'interest', v)} />
              <MoneyInput label="Foreign Tax Paid" value={f.foreignTaxPaid} estimated={f.isEstimate} onChange={(v) => update(f.id, 'foreignTaxPaid', v)} />
            </div>
            <label className="flex items-center gap-2 text-sm text-gray-500">
              <input type="checkbox" checked={f.isForeign} onChange={(e) => update(f.id, 'isForeign', e.target.checked)} />
              Foreign account
            </label>
            {f.isForeign && (
              <input
                type="text" placeholder="Country" value={f.country || ''}
                onChange={(e) => update(f.id, 'country', e.target.value)}
                className="border border-gray-200 rounded px-3 py-1 text-sm w-full"
              />
            )}
          </div>
        </div>
      ))}
      <button onClick={add} className="text-blue-600 hover:text-blue-700 text-sm font-medium">+ Add 1099-INT</button>
    </FormEditor>
  );
}
