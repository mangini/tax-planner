import { useState, useMemo } from 'react';
import { amountValue } from '@shared/types';
import type { TaxYearData } from '@shared/types';

interface Props {
  data: TaxYearData | null;
  onSave: (data: Partial<TaxYearData>) => Promise<void>;
}

interface ChecklistItem {
  id: string;
  label: string;
}

function deriveItems(data: TaxYearData): ChecklistItem[] {
  const items: ChecklistItem[] = [];

  for (const w of data.w2) {
    items.push({ id: w.id, label: `W-2 from ${w.employer || '(unnamed)'}` });
  }
  for (const f of data.form1099INT) {
    items.push({ id: f.id, label: `1099-INT from ${f.payer || '(unnamed)'}` });
  }
  for (const f of data.form1099DIV) {
    items.push({ id: f.id, label: `1099-DIV from ${f.payer || '(unnamed)'}` });
  }
  for (const f of data.form1099B) {
    items.push({ id: f.id, label: `1099-B from ${f.broker || '(unnamed)'}` });
  }
  for (const f of data.form1099G) {
    items.push({ id: f.id, label: `1099-G from ${f.state || '(unnamed)'}` });
  }
  for (const f of data.form1099R) {
    items.push({ id: f.id, label: `1099-R from ${f.payer || '(unnamed)'}` });
  }
  for (const f of data.form1098) {
    items.push({ id: f.id, label: `1098 from ${f.lender || '(unnamed)'}` });
  }
  for (const f of data.scheduleK1) {
    items.push({ id: f.id, label: `Schedule K-1 from ${f.partnershipName || '(unnamed)'}` });
  }

  if (data.foreignRentalIncome) {
    items.push({ id: 'foreignRental', label: `Foreign Rental Income (${data.foreignRentalIncome.country || '?'})` });
  }
  if (data.foreignBankIncome) {
    items.push({ id: 'foreignBank', label: `Foreign Bank Income (${data.foreignBankIncome.country || '?'})` });
  }
  if (data.hsa) {
    items.push({ id: 'hsa', label: 'Form 8889 (HSA)' });
  }
  if (data.charitable && data.charitable.donations && data.charitable.donations.some(d => amountValue(d.amount) > 0)) {
    items.push({ id: 'charitable', label: 'Charitable Contributions' });
  }
  if (data.foreignAccounts.length > 0) {
    items.push({ id: 'foreignAccounts', label: 'FBAR / Form 8938 (Foreign Accounts)' });
  }
  if (data.estimatedPayments) {
    items.push({ id: 'estimatedPayments', label: 'Estimated Tax Payments' });
  }

  return items;
}

export default function ChecklistPage({ data, onSave }: Props) {
  const [checked, setChecked] = useState<Record<string, boolean>>(data?.checklistChecked ?? {});
  const [saving, setSaving] = useState(false);

  const items = useMemo(() => (data ? deriveItems(data) : []), [data]);
  const checkedCount = items.filter(i => checked[i.id]).length;
  const dirty = JSON.stringify(checked) !== JSON.stringify(data?.checklistChecked ?? {});

  const toggle = (id: string) => {
    setChecked(prev => ({ ...prev, [id]: !prev[id] }));
  };

  const save = async () => {
    setSaving(true);
    await onSave({ checklistChecked: checked });
    setSaving(false);
  };

  if (!data) return null;

  return (
    <div className="max-w-2xl mx-auto">
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-2xl font-bold text-gray-900">CPA Checklist</h1>
        <span className="text-sm text-gray-500">
          {checkedCount} of {items.length} items ready
        </span>
      </div>

      {items.length === 0 ? (
        <p className="text-gray-500">No forms entered yet. Add forms in the Forms tab to see checklist items here.</p>
      ) : (
        <div className="bg-white rounded-lg border border-gray-200 divide-y divide-gray-100">
          {items.map(item => (
            <label
              key={item.id}
              className="flex items-center gap-3 px-4 py-3 hover:bg-gray-50 cursor-pointer"
            >
              <input
                type="checkbox"
                checked={!!checked[item.id]}
                onChange={() => toggle(item.id)}
                className="h-4 w-4 rounded border-gray-300 text-blue-600 focus:ring-blue-500"
              />
              <span className={checked[item.id] ? 'text-gray-400 line-through' : 'text-gray-900'}>
                {item.label}
              </span>
            </label>
          ))}
        </div>
      )}

      {items.length > 0 && (
        <div className="mt-4 flex justify-end">
          <button
            onClick={save}
            disabled={!dirty || saving}
            className="px-4 py-2 bg-blue-600 text-white text-sm font-medium rounded hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {saving ? 'Saving...' : 'Save'}
          </button>
        </div>
      )}
    </div>
  );
}
