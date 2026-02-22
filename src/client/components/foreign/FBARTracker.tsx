import { useState } from 'react';
import { v4 as uuid } from 'uuid';
import type { ForeignAccountData, TaxAmount, TaxYearData, ComputationResult } from '@shared/types';
import MoneyInput from '../forms/MoneyInput';
import OwnerSelect from '../forms/OwnerSelect';

interface Props {
  data: TaxYearData | null;
  result: ComputationResult | null;
  onSave: (data: Partial<TaxYearData>) => Promise<void>;
}

const newAccount = (): ForeignAccountData => ({
  id: uuid(), owner: 'self', institution: '', country: '', accountType: 'deposit', maxValue: 0, yearEndValue: 0, isClosed: false,
});

export default function FBARTracker({ data, result, onSave }: Props) {
  const [accounts, setAccounts] = useState<ForeignAccountData[]>(data?.foreignAccounts || []);
  const [saving, setSaving] = useState(false);

  const add = () => setAccounts([...accounts, newAccount()]);
  const remove = (id: string) => setAccounts(accounts.filter((a) => a.id !== id));
  const update = (id: string, field: string, value: any) =>
    setAccounts(accounts.map((a) => (a.id === id ? { ...a, [field]: value } : a)));

  const handleSave = async () => {
    setSaving(true);
    await onSave({ foreignAccounts: accounts });
    setSaving(false);
  };

  return (
    <div className="space-y-6">
      {result?.fbar && (
        <div className={`p-4 rounded-lg border-2 ${result.fbar.fbarRequired ? 'border-red-300 bg-red-50' : 'border-green-300 bg-green-50'}`}>
          <div className="flex justify-between items-center">
            <div>
              <p className="font-medium text-gray-900">
                Aggregate Max Balance: {result.fbar.aggregateMaxBalance.toLocaleString('en-US', { style: 'currency', currency: 'USD', maximumFractionDigits: 0 })}
                {' · '}Year-End: {result.fbar.aggregateYearEndBalance.toLocaleString('en-US', { style: 'currency', currency: 'USD', maximumFractionDigits: 0 })}
              </p>
              <div className="flex gap-4 mt-2 text-sm">
                <span className={result.fbar.fbarRequired ? 'text-red-600 font-medium' : 'text-green-600'}>
                  FBAR: {result.fbar.fbarRequired ? 'Required' : 'Not required'}
                </span>
                <span className={result.fbar.form8938Required ? 'text-red-600 font-medium' : 'text-green-600'}>
                  Form 8938: {result.fbar.form8938Required ? 'Required' : 'Not required'}
                </span>
              </div>
            </div>
          </div>
        </div>
      )}

      <div className="bg-white rounded-lg border border-gray-200 p-6">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-lg font-semibold text-gray-900">Foreign Accounts</h2>
          <button
            onClick={handleSave}
            disabled={saving}
            className="px-4 py-2 bg-blue-600 text-white text-sm font-medium rounded hover:bg-blue-700 disabled:opacity-50"
          >
            {saving ? 'Saving...' : 'Save'}
          </button>
        </div>

        {accounts.length === 0 && <p className="text-gray-500 text-sm">No foreign accounts. Click "Add" to track one.</p>}
        {accounts.map((a) => (
          <div key={a.id} className="border border-gray-200 rounded p-4 mb-3">
            <div className="flex justify-between items-center mb-3 gap-2">
              <OwnerSelect value={a.owner} onChange={(v) => update(a.id, 'owner', v)} />
              <input type="text" placeholder="Institution" value={a.institution}
                onChange={(e) => update(a.id, 'institution', e.target.value)}
                className="border border-gray-300 rounded px-3 py-1.5 text-sm flex-1" />
              <button onClick={() => remove(a.id)} className="text-red-500 hover:text-red-700 text-sm">Remove</button>
            </div>
            <div className="grid grid-cols-4 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Country</label>
                <input type="text" value={a.country} onChange={(e) => update(a.id, 'country', e.target.value)}
                  className="border border-gray-300 rounded px-3 py-1.5 text-sm w-full" />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Type</label>
                <select value={a.accountType} onChange={(e) => update(a.id, 'accountType', e.target.value)}
                  className="border border-gray-300 rounded px-3 py-1.5 text-sm w-full">
                  <option value="deposit">Deposit</option>
                  <option value="securities">Securities</option>
                  <option value="other">Other</option>
                </select>
              </div>
              <MoneyInput label="Max Value" value={a.maxValue} onChange={(v) => update(a.id, 'maxValue', v)} />
              <MoneyInput label="Year-End Value" value={a.yearEndValue} onChange={(v) => update(a.id, 'yearEndValue', v)} />
            </div>
            <label className="flex items-center gap-2 mt-2 text-sm">
              <input type="checkbox" checked={a.isClosed} onChange={(e) => update(a.id, 'isClosed', e.target.checked)} />
              Account closed during the year
            </label>
          </div>
        ))}
        <button onClick={add} className="text-blue-600 hover:text-blue-700 text-sm font-medium">+ Add Account</button>
      </div>
    </div>
  );
}
