import { useState } from 'react';

interface Props {
  title: string;
  onSave: () => void;
  saving?: boolean;
  children: React.ReactNode;
}

export default function FormEditor({ title, onSave, saving, children }: Props) {
  return (
    <div className="bg-white rounded-lg border border-gray-200 p-6">
      <div className="flex items-center justify-between mb-4">
        <h2 className="text-lg font-semibold text-gray-900">{title}</h2>
        <button
          onClick={onSave}
          disabled={saving}
          className="px-4 py-2 bg-blue-600 text-white text-sm font-medium rounded hover:bg-blue-700 disabled:opacity-50"
        >
          {saving ? 'Saving...' : 'Save'}
        </button>
      </div>
      {children}
    </div>
  );
}
