import { useState } from 'react';
import type { EstimatedPaymentsData, PriorYearTaxData } from '@shared/types';
import MoneyInput from './MoneyInput';
import FormEditor from './FormEditor';

interface Props {
  year: number;
  data: EstimatedPaymentsData | undefined;
  onSave: (data: { estimatedPayments: EstimatedPaymentsData }) => Promise<void>;
}

const defaults: EstimatedPaymentsData = {
  federalQ1: 0, federalQ2: 0, federalQ3: 0, federalQ4: 0,
  stateQ1: 0, stateQ2: 0, stateQ3: 0, stateQ4: 0,
};

const emptyPrior: PriorYearTaxData = { federalTotalTax: 0, federalAgi: 0, coloradoNetTax: 0 };

export default function EstimatedPaymentsForm({ year, data, onSave }: Props) {
  const [form, setForm] = useState<EstimatedPaymentsData>(data || defaults);
  const [saving, setSaving] = useState(false);

  const update = (field: Exclude<keyof EstimatedPaymentsData, 'priorYear'>, value: number) =>
    setForm((f) => ({ ...f, [field]: value }));
  const prior = form.priorYear ?? emptyPrior;
  const updatePrior = (field: keyof PriorYearTaxData, value: number) =>
    setForm((f) => ({ ...f, priorYear: { ...(f.priorYear ?? emptyPrior), [field]: value } }));

  const handleSave = async () => {
    setSaving(true);
    await onSave({ estimatedPayments: form });
    setSaving(false);
  };

  return (
    <FormEditor title="Estimated Tax Payments" onSave={handleSave} saving={saving}>
      <div className="space-y-3">
        <h3 className="text-xs font-medium text-gray-400 uppercase tracking-wide">{year - 1} Return (for safe harbor)</h3>
        <div className="grid grid-cols-3 gap-3">
          <MoneyInput label="Federal total tax (1040 line 24)" value={prior.federalTotalTax} onChange={(v) => updatePrior('federalTotalTax', v)} />
          <MoneyInput label="Federal AGI (1040 line 11)" value={prior.federalAgi} onChange={(v) => updatePrior('federalAgi', v)} />
          <MoneyInput label="Colorado net tax (DR 0104)" value={prior.coloradoNetTax} onChange={(v) => updatePrior('coloradoNetTax', v)} />
        </div>
        <p className="text-xs text-gray-400 -mt-1">
          Leave blank to use this tool's own {year - 1} calculation, if that year exists.
        </p>
        <h3 className="text-xs font-medium text-gray-400 uppercase tracking-wide pt-1">Federal Estimated Payments</h3>
        <div className="grid grid-cols-4 gap-3">
          <MoneyInput label="Q1" value={form.federalQ1} onChange={(v) => update('federalQ1', v)} />
          <MoneyInput label="Q2" value={form.federalQ2} onChange={(v) => update('federalQ2', v)} />
          <MoneyInput label="Q3" value={form.federalQ3} onChange={(v) => update('federalQ3', v)} />
          <MoneyInput label="Q4" value={form.federalQ4} onChange={(v) => update('federalQ4', v)} />
        </div>
        <h3 className="text-xs font-medium text-gray-400 uppercase tracking-wide pt-1">State Estimated Payments</h3>
        <div className="grid grid-cols-4 gap-3">
          <MoneyInput label="Q1" value={form.stateQ1} onChange={(v) => update('stateQ1', v)} />
          <MoneyInput label="Q2" value={form.stateQ2} onChange={(v) => update('stateQ2', v)} />
          <MoneyInput label="Q3" value={form.stateQ3} onChange={(v) => update('stateQ3', v)} />
          <MoneyInput label="Q4" value={form.stateQ4} onChange={(v) => update('stateQ4', v)} />
        </div>
      </div>
    </FormEditor>
  );
}
