import { useState } from 'react';
import { v4 as uuid } from 'uuid';
import type { Form1099RData } from '@shared/types';
import MoneyInput from './MoneyInput';
import OwnerSelect from './OwnerSelect';
import EstimateToggle from './EstimateToggle';
import FormEditor from './FormEditor';

interface Props {
  data: Form1099RData[];
  onSave: (data: { form1099R: Form1099RData[] }) => Promise<void>;
}

export default function Form1099R({ data, onSave }: Props) {
  const [forms, setForms] = useState<Form1099RData[]>(data);
  const [saving, setSaving] = useState(false);

  const add = () =>
    setForms([...forms, { id: uuid(), owner: 'self', payer: '', grossDistribution: 0, taxableAmount: 0, federalWithheld: 0, stateWithheld: 0 }]);
  const remove = (id: string) => setForms(forms.filter((f) => f.id !== id));
  const update = (id: string, field: string, value: any) =>
    setForms(forms.map((f) => (f.id === id ? { ...f, [field]: value } : f)));

  const handleSave = async () => {
    setSaving(true);
    await onSave({ form1099R: forms });
    setSaving(false);
  };

  return (
    <FormEditor title="1099-R Retirement Distributions" onSave={handleSave} saving={saving}>
      {forms.length === 0 && <p className="text-gray-500 text-sm">No 1099-R forms.</p>}
      {forms.map((f) => (
        <div key={f.id} className={`border rounded p-4 mb-3 ${f.isEstimate ? 'border-amber-300 bg-amber-50/30' : 'border-gray-200'}`}>
          <div className="flex justify-between items-center mb-3 gap-2">
            <OwnerSelect value={f.owner} onChange={(v) => update(f.id, 'owner', v)} />
            <input type="text" placeholder="Payer" value={f.payer} onChange={(e) => update(f.id, 'payer', e.target.value)}
              className="border border-gray-300 rounded px-3 py-1.5 text-sm flex-1" />
            <EstimateToggle isEstimate={!!f.isEstimate} onChange={(v) => update(f.id, 'isEstimate', v)} />
            <button onClick={() => remove(f.id)} className="text-red-500 hover:text-red-700 text-sm">Remove</button>
          </div>
          <div className="grid grid-cols-2 gap-4">
            <MoneyInput label="1: Gross Distribution" value={f.grossDistribution} estimated={f.isEstimate} onChange={(v) => update(f.id, 'grossDistribution', v)} />
            <MoneyInput label="2a: Taxable Amount" value={f.taxableAmount} estimated={f.isEstimate} onChange={(v) => update(f.id, 'taxableAmount', v)} />
            <MoneyInput label="4: Federal Withheld" value={f.federalWithheld} estimated={f.isEstimate} onChange={(v) => update(f.id, 'federalWithheld', v)} />
            <MoneyInput label="12: State Withheld" value={f.stateWithheld} estimated={f.isEstimate} onChange={(v) => update(f.id, 'stateWithheld', v)} />
          </div>
        </div>
      ))}
      <button onClick={add} className="text-blue-600 hover:text-blue-700 text-sm font-medium">+ Add 1099-R</button>
    </FormEditor>
  );
}
