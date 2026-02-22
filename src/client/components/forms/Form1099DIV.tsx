import { useState } from 'react';
import { v4 as uuid } from 'uuid';
import type { Form1099DIVData } from '@shared/types';
import MoneyInput from './MoneyInput';
import OwnerSelect from './OwnerSelect';
import EstimateToggle from './EstimateToggle';
import FormEditor from './FormEditor';

interface Props {
  data: Form1099DIVData[];
  onSave: (data: { form1099DIV: Form1099DIVData[] }) => Promise<void>;
}

export default function Form1099DIV({ data, onSave }: Props) {
  const [forms, setForms] = useState<Form1099DIVData[]>(data);
  const [saving, setSaving] = useState(false);

  const add = () =>
    setForms([...forms, { id: uuid(), owner: 'self', payer: '', ordinaryDividends: 0, qualifiedDividends: 0, capitalGainDistributions: 0, foreignTaxPaid: 0 }]);
  const remove = (id: string) => setForms(forms.filter((f) => f.id !== id));
  const update = (id: string, field: string, value: any) =>
    setForms(forms.map((f) => (f.id === id ? { ...f, [field]: value } : f)));

  const handleSave = async () => {
    setSaving(true);
    await onSave({ form1099DIV: forms });
    setSaving(false);
  };

  return (
    <FormEditor title="1099-DIV Dividend Income" onSave={handleSave} saving={saving}>
      {forms.length === 0 && <p className="text-gray-500 text-sm">No 1099-DIV forms.</p>}
      {forms.map((f) => (
        <div key={f.id} className={`rounded-lg mb-3 overflow-hidden border ${f.isEstimate ? 'border-amber-200 bg-amber-50/20' : 'border-gray-100'}`}>
          <div className={`flex items-center gap-2 px-4 py-2.5 ${f.isEstimate ? 'bg-amber-50/60' : 'bg-gray-50'}`}>
            <OwnerSelect value={f.owner} onChange={(v) => update(f.id, 'owner', v)} />
            <input type="text" placeholder="Payer name" value={f.payer} onChange={(e) => update(f.id, 'payer', e.target.value)}
              className="border border-gray-200 rounded px-3 py-1 text-sm flex-1 bg-white/80" />
            <EstimateToggle isEstimate={!!f.isEstimate} onChange={(v) => update(f.id, 'isEstimate', v)} />
            <button onClick={() => remove(f.id)} className="text-red-400 hover:text-red-600 text-xs">Remove</button>
          </div>
          <div className="px-4 py-3">
            <div className="grid grid-cols-4 gap-3">
              <MoneyInput label="1a: Ordinary Dividends" value={f.ordinaryDividends} estimated={f.isEstimate} onChange={(v) => update(f.id, 'ordinaryDividends', v)} />
              <MoneyInput label="1b: Qualified Dividends" value={f.qualifiedDividends} estimated={f.isEstimate} onChange={(v) => update(f.id, 'qualifiedDividends', v)} />
              <MoneyInput label="2a: Cap Gain Dist." value={f.capitalGainDistributions} estimated={f.isEstimate} onChange={(v) => update(f.id, 'capitalGainDistributions', v)} />
              <MoneyInput label="7: Foreign Tax Paid" value={f.foreignTaxPaid} estimated={f.isEstimate} onChange={(v) => update(f.id, 'foreignTaxPaid', v)} />
            </div>
            {f.country !== undefined && (
              <input type="text" placeholder="Country" value={f.country || ''} onChange={(e) => update(f.id, 'country', e.target.value)}
                className="border border-gray-200 rounded px-3 py-1 text-sm mt-2 w-full" />
            )}
          </div>
        </div>
      ))}
      <button onClick={add} className="text-blue-600 hover:text-blue-700 text-sm font-medium">+ Add 1099-DIV</button>
    </FormEditor>
  );
}
