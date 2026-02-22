import { useState } from 'react';
import { v4 as uuid } from 'uuid';
import type { Form1099BData } from '@shared/types';
import MoneyInput from './MoneyInput';
import OwnerSelect from './OwnerSelect';
import EstimateToggle from './EstimateToggle';
import FormEditor from './FormEditor';

interface Props {
  data: Form1099BData[];
  onSave: (data: { form1099B: Form1099BData[] }) => Promise<void>;
}

const newForm = (): Form1099BData => ({
  id: uuid(), owner: 'self', broker: '', shortTermProceeds: 0, shortTermBasis: 0, longTermProceeds: 0, longTermBasis: 0,
});

export default function Form1099B({ data, onSave }: Props) {
  const [forms, setForms] = useState<Form1099BData[]>(data);
  const [saving, setSaving] = useState(false);

  const add = () => setForms([...forms, newForm()]);
  const remove = (id: string) => setForms(forms.filter((f) => f.id !== id));
  const update = (id: string, field: string, value: any) =>
    setForms(forms.map((f) => (f.id === id ? { ...f, [field]: value } : f)));

  const handleSave = async () => {
    setSaving(true);
    await onSave({ form1099B: forms });
    setSaving(false);
  };

  return (
    <FormEditor title="1099-B Capital Gains" onSave={handleSave} saving={saving}>
      {forms.length === 0 && <p className="text-gray-500 text-sm">No 1099-B forms.</p>}
      {forms.map((f) => (
        <div key={f.id} className={`border rounded p-4 mb-3 ${f.isEstimate ? 'border-amber-300 bg-amber-50/30' : 'border-gray-200'}`}>
          <div className="flex justify-between items-center mb-3 gap-2">
            <OwnerSelect value={f.owner} onChange={(v) => update(f.id, 'owner', v)} />
            <input type="text" placeholder="Broker name" value={f.broker}
              onChange={(e) => update(f.id, 'broker', e.target.value)}
              className="border border-gray-300 rounded px-3 py-1.5 text-sm flex-1" />
            <EstimateToggle isEstimate={!!f.isEstimate} onChange={(v) => update(f.id, 'isEstimate', v)} />
            <button onClick={() => remove(f.id)} className="text-red-500 hover:text-red-700 text-sm">Remove</button>
          </div>
          <h4 className="text-xs font-medium text-gray-500 uppercase mb-2">Short-Term</h4>
          <div className="grid grid-cols-2 gap-4">
            <MoneyInput label="Proceeds" value={f.shortTermProceeds} estimated={f.isEstimate} onChange={(v) => update(f.id, 'shortTermProceeds', v)} />
            <MoneyInput label="Cost Basis" value={f.shortTermBasis} estimated={f.isEstimate} onChange={(v) => update(f.id, 'shortTermBasis', v)} />
          </div>
          <h4 className="text-xs font-medium text-gray-500 uppercase mb-2 mt-3">Long-Term</h4>
          <div className="grid grid-cols-2 gap-4">
            <MoneyInput label="Proceeds" value={f.longTermProceeds} estimated={f.isEstimate} onChange={(v) => update(f.id, 'longTermProceeds', v)} />
            <MoneyInput label="Cost Basis" value={f.longTermBasis} estimated={f.isEstimate} onChange={(v) => update(f.id, 'longTermBasis', v)} />
          </div>
        </div>
      ))}
      <button onClick={add} className="text-blue-600 hover:text-blue-700 text-sm font-medium">+ Add 1099-B</button>
    </FormEditor>
  );
}
