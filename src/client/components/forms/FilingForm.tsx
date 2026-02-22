import { useState } from 'react';
import type { FilingData } from '@shared/types';
import FormEditor from './FormEditor';

interface Props {
  data: FilingData;
  onSave: (data: { filing: FilingData }) => Promise<void>;
}

export default function FilingForm({ data, onSave }: Props) {
  const [form, setForm] = useState<FilingData>(data);
  const [saving, setSaving] = useState(false);

  const handleSave = async () => {
    setSaving(true);
    await onSave({ filing: form });
    setSaving(false);
  };

  return (
    <FormEditor title="Filing Status" onSave={handleSave} saving={saving}>
      <div className="space-y-4">
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Filing Status</label>
          <select
            value={form.status}
            onChange={(e) => setForm({ ...form, status: e.target.value as FilingData['status'] })}
            className="border border-gray-300 rounded px-3 py-1.5 text-sm w-full"
          >
            <option value="single">Single</option>
            <option value="mfj">Married Filing Jointly</option>
            <option value="mfs">Married Filing Separately</option>
            <option value="hoh">Head of Household</option>
          </select>
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Number of Children</label>
          <input
            type="number"
            min={0}
            value={form.numChildren}
            onChange={(e) => setForm({ ...form, numChildren: parseInt(e.target.value) || 0 })}
            className="border border-gray-300 rounded px-3 py-1.5 text-sm w-24"
          />
        </div>
      </div>
    </FormEditor>
  );
}
