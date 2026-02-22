import { useState } from 'react';
import { v4 as uuid } from 'uuid';
import type { ScheduleK1Data } from '@shared/types';
import MoneyInput from './MoneyInput';
import OwnerSelect from './OwnerSelect';
import EstimateToggle from './EstimateToggle';
import FormEditor from './FormEditor';

interface Props {
  data: ScheduleK1Data[];
  onSave: (data: { scheduleK1: ScheduleK1Data[] }) => Promise<void>;
}

const newK1 = (): ScheduleK1Data => ({
  id: uuid(), owner: 'self', partnershipName: '', ein: '',
  ordinaryIncome: 0, rentalIncome: 0, interestIncome: 0,
  ordinaryDividends: 0, qualifiedDividends: 0,
  shortTermCapitalGain: 0, longTermCapitalGain: 0,
  section199A: 0, foreignTaxPaid: 0, selfEmploymentEarnings: 0,
});

export default function ScheduleK1({ data, onSave }: Props) {
  const [forms, setForms] = useState<ScheduleK1Data[]>(data);
  const [saving, setSaving] = useState(false);

  const add = () => setForms([...forms, newK1()]);
  const remove = (id: string) => setForms(forms.filter((f) => f.id !== id));
  const update = (id: string, field: string, value: any) =>
    setForms(forms.map((f) => (f.id === id ? { ...f, [field]: value } : f)));

  const handleSave = async () => {
    setSaving(true);
    await onSave({ scheduleK1: forms });
    setSaving(false);
  };

  return (
    <FormEditor title="Schedule K-1 Partnership Income" onSave={handleSave} saving={saving}>
      {forms.length === 0 && <p className="text-gray-500 text-sm">No K-1 forms.</p>}
      {forms.map((f) => (
        <div key={f.id} className={`border rounded p-4 mb-4 ${f.isEstimate ? 'border-amber-300 bg-amber-50/30' : 'border-gray-200'}`}>
          <div className="flex justify-between items-center mb-3 gap-2">
            <OwnerSelect value={f.owner} onChange={(v) => update(f.id, 'owner', v)} />
            <input type="text" placeholder="Partnership name" value={f.partnershipName}
              onChange={(e) => update(f.id, 'partnershipName', e.target.value)}
              className="border border-gray-300 rounded px-3 py-1.5 text-sm flex-1" />
            <input type="text" placeholder="EIN" value={f.ein}
              onChange={(e) => update(f.id, 'ein', e.target.value)}
              className="border border-gray-300 rounded px-3 py-1.5 text-sm w-32" />
            <EstimateToggle isEstimate={!!f.isEstimate} onChange={(v) => update(f.id, 'isEstimate', v)} />
            <button onClick={() => remove(f.id)} className="text-red-500 hover:text-red-700 text-sm">Remove</button>
          </div>
          <div className="grid grid-cols-2 gap-4">
            <MoneyInput label="Box 1: Ordinary Income" value={f.ordinaryIncome} estimated={f.isEstimate} onChange={(v) => update(f.id, 'ordinaryIncome', v)} />
            <MoneyInput label="Box 2: Rental Income" value={f.rentalIncome} estimated={f.isEstimate} onChange={(v) => update(f.id, 'rentalIncome', v)} />
            <MoneyInput label="Box 5: Interest Income" value={f.interestIncome} estimated={f.isEstimate} onChange={(v) => update(f.id, 'interestIncome', v)} />
            <MoneyInput label="Box 6a: Ordinary Dividends" value={f.ordinaryDividends} estimated={f.isEstimate} onChange={(v) => update(f.id, 'ordinaryDividends', v)} />
            <MoneyInput label="Box 6b: Qualified Dividends" value={f.qualifiedDividends} estimated={f.isEstimate} onChange={(v) => update(f.id, 'qualifiedDividends', v)} />
            <MoneyInput label="Box 8: Short-Term Cap Gain" value={f.shortTermCapitalGain} estimated={f.isEstimate} onChange={(v) => update(f.id, 'shortTermCapitalGain', v)} />
            <MoneyInput label="Box 9a: Long-Term Cap Gain" value={f.longTermCapitalGain} estimated={f.isEstimate} onChange={(v) => update(f.id, 'longTermCapitalGain', v)} />
            <MoneyInput label="Box 17: Sec 199A" value={f.section199A} estimated={f.isEstimate} onChange={(v) => update(f.id, 'section199A', v)} />
            <MoneyInput label="Box 16: Foreign Tax Paid" value={f.foreignTaxPaid} estimated={f.isEstimate} onChange={(v) => update(f.id, 'foreignTaxPaid', v)} />
            <MoneyInput label="Box 14: SE Earnings" value={f.selfEmploymentEarnings} estimated={f.isEstimate} onChange={(v) => update(f.id, 'selfEmploymentEarnings', v)} />
          </div>
        </div>
      ))}
      <button onClick={add} className="text-blue-600 hover:text-blue-700 text-sm font-medium">+ Add K-1</button>
    </FormEditor>
  );
}
