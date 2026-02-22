import type { FormOwner } from '@shared/types';

interface Props {
  value: FormOwner;
  onChange: (value: FormOwner) => void;
}

const labels: Record<FormOwner, string> = {
  self: 'Self',
  spouse: 'Spouse',
  joint: 'Joint',
};

export default function OwnerSelect({ value, onChange }: Props) {
  return (
    <div className="flex gap-1">
      {(['self', 'spouse', 'joint'] as FormOwner[]).map((o) => (
        <button
          key={o}
          type="button"
          onClick={() => onChange(o)}
          className={`px-2 py-0.5 text-xs font-medium rounded transition-colors ${
            value === o
              ? 'bg-blue-100 text-blue-700 ring-1 ring-blue-300'
              : 'bg-gray-100 text-gray-500 hover:bg-gray-200'
          }`}
        >
          {labels[o]}
        </button>
      ))}
    </div>
  );
}
