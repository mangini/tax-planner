import { useState } from 'react';
import { v4 as uuid } from 'uuid';
import type { W2Data, TaxAmount, FormOwner } from '@shared/types';
import MoneyInput from './MoneyInput';
import OwnerSelect from './OwnerSelect';
import EstimateToggle from './EstimateToggle';
import FormEditor from './FormEditor';
import YTDEstimator from './YTDEstimator';

interface Props {
  data: W2Data[];
  onSave: (data: { w2: W2Data[] }) => Promise<void>;
}

const newW2 = (): W2Data => ({
  id: uuid(),
  owner: 'self',
  employer: '',
  wages: 0,
  federalWithheld: 0,
  socialSecurityWages: 0,
  socialSecurityWithheld: 0,
  medicareWages: 0,
  medicareWithheld: 0,
  stateWages: 0,
  stateWithheld: 0,
  hsaEmployerContribution: 0,
});

export default function W2Form({ data, onSave }: Props) {
  const [forms, setForms] = useState<W2Data[]>(data.length > 0 ? data : []);
  const [saving, setSaving] = useState(false);

  const add = () => setForms([...forms, newW2()]);
  const remove = (id: string) => setForms(forms.filter((f) => f.id !== id));
  const update = (id: string, field: string, value: TaxAmount | string | boolean) =>
    setForms(forms.map((f) => (f.id === id ? { ...f, [field]: value } : f)));

  const handleSave = async () => {
    setSaving(true);
    await onSave({ w2: forms });
    setSaving(false);
  };

  return (
    <FormEditor title="W-2 Wage and Tax Statement" onSave={handleSave} saving={saving}>
      {forms.length === 0 && <p className="text-gray-500 text-sm">No W-2 forms. Click "Add" to create one.</p>}
      {forms.map((f) => (
        <div key={f.id} className={`border rounded p-4 mb-4 ${f.isEstimate ? 'border-amber-300 bg-amber-50/30' : 'border-gray-200'}`}>
          <div className="flex justify-between items-center mb-3 gap-2">
            <OwnerSelect value={f.owner} onChange={(v) => update(f.id, 'owner', v)} />
            <input
              type="text"
              placeholder="Employer name"
              value={f.employer}
              onChange={(e) => update(f.id, 'employer', e.target.value)}
              className="border border-gray-300 rounded px-3 py-1.5 text-sm flex-1"
            />
            <EstimateToggle isEstimate={!!f.isEstimate} onChange={(v) => update(f.id, 'isEstimate', v)} />
            <button onClick={() => remove(f.id)} className="text-red-500 hover:text-red-700 text-sm">Remove</button>
          </div>
          {f.isEstimate && (
            <YTDEstimator onApply={(values) => {
              setForms(forms.map((form) => form.id === f.id ? { ...form, ...values } : form));
            }} />
          )}
          <div className="grid grid-cols-2 gap-4">
            <MoneyInput label="Box 1: Wages" value={f.wages} estimated={f.isEstimate} onChange={(v) => update(f.id, 'wages', v)} />
            <MoneyInput label="Box 2: Federal Withheld" value={f.federalWithheld} estimated={f.isEstimate} onChange={(v) => update(f.id, 'federalWithheld', v)} />
          </div>
          <div className="grid grid-cols-2 gap-4 mt-3">
            <MoneyInput label="Box 3: SS Wages" value={f.socialSecurityWages} estimated={f.isEstimate} onChange={(v) => update(f.id, 'socialSecurityWages', v)} />
            <MoneyInput label="Box 4: SS Withheld" value={f.socialSecurityWithheld} estimated={f.isEstimate} onChange={(v) => update(f.id, 'socialSecurityWithheld', v)} />
          </div>
          <div className="grid grid-cols-2 gap-4 mt-3">
            <MoneyInput label="Box 5: Medicare Wages" value={f.medicareWages} estimated={f.isEstimate} onChange={(v) => update(f.id, 'medicareWages', v)} />
            <MoneyInput label="Box 6: Medicare Withheld" value={f.medicareWithheld} estimated={f.isEstimate} onChange={(v) => update(f.id, 'medicareWithheld', v)} />
          </div>
          <div className="grid grid-cols-2 gap-4 mt-3">
            <MoneyInput label="Box 16: State Wages" value={f.stateWages} estimated={f.isEstimate} onChange={(v) => update(f.id, 'stateWages', v)} />
            <MoneyInput label="Box 17: State Withheld" value={f.stateWithheld} estimated={f.isEstimate} onChange={(v) => update(f.id, 'stateWithheld', v)} />
          </div>
          <div className="mt-3">
            <MoneyInput label="Box 12 Code W: HSA Employer Contribution" value={f.hsaEmployerContribution} estimated={f.isEstimate} onChange={(v) => update(f.id, 'hsaEmployerContribution', v)} />
          </div>
        </div>
      ))}
      <button onClick={add} className="text-blue-600 hover:text-blue-700 text-sm font-medium">+ Add W-2</button>
    </FormEditor>
  );
}
