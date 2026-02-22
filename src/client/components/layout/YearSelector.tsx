import { useState } from 'react';

interface Props {
  years: number[];
  selectedYear: number;
  onYearChange: (year: number) => void;
  onCreateYear: (year: number, cloneFrom?: number) => void;
  onDeleteYear: (year: number) => void;
}

export default function YearSelector({ years, selectedYear, onYearChange, onCreateYear, onDeleteYear }: Props) {
  const [showNew, setShowNew] = useState(false);
  const [newYear, setNewYear] = useState(new Date().getFullYear());
  const [showDelete, setShowDelete] = useState(false);
  const [deleteConfirm, setDeleteConfirm] = useState('');

  return (
    <div className="flex items-center gap-2">
      <select
        value={selectedYear}
        onChange={(e) => onYearChange(parseInt(e.target.value, 10))}
        className="border border-gray-300 rounded px-3 py-1.5 text-sm bg-white"
      >
        {years.map((y) => (
          <option key={y} value={y}>
            Tax Year {y}
          </option>
        ))}
      </select>

      {showDelete ? (
        <div className="flex items-center gap-1">
          <span className="text-sm text-red-600">Type {selectedYear} to confirm:</span>
          <input
            type="text"
            value={deleteConfirm}
            onChange={(e) => setDeleteConfirm(e.target.value)}
            placeholder={String(selectedYear)}
            className="border border-red-300 rounded px-2 py-1.5 text-sm w-16 focus:outline-none focus:ring-1 focus:ring-red-400"
            autoFocus
          />
          <button
            onClick={() => {
              if (deleteConfirm === String(selectedYear)) {
                onDeleteYear(selectedYear);
                setShowDelete(false);
                setDeleteConfirm('');
              }
            }}
            disabled={deleteConfirm !== String(selectedYear)}
            className="px-2 py-1.5 bg-red-600 text-white text-sm rounded hover:bg-red-700 disabled:opacity-40 disabled:cursor-not-allowed"
          >
            Delete
          </button>
          <button
            onClick={() => { setShowDelete(false); setDeleteConfirm(''); }}
            className="px-2 py-1.5 text-gray-500 text-sm hover:text-gray-700"
          >
            Cancel
          </button>
        </div>
      ) : showNew ? (
        <div className="flex items-center gap-1">
          <input
            type="number"
            value={newYear}
            onChange={(e) => setNewYear(parseInt(e.target.value, 10))}
            className="border border-gray-300 rounded px-2 py-1.5 text-sm w-20"
          />
          <button
            onClick={() => {
              onCreateYear(newYear, selectedYear);
              setShowNew(false);
            }}
            className="px-2 py-1.5 bg-blue-600 text-white text-sm rounded hover:bg-blue-700"
          >
            Create
          </button>
          <button
            onClick={() => setShowNew(false)}
            className="px-2 py-1.5 text-gray-500 text-sm hover:text-gray-700"
          >
            Cancel
          </button>
        </div>
      ) : (
        <>
          <button
            onClick={() => setShowNew(true)}
            className="px-2 py-1.5 text-sm text-blue-600 hover:text-blue-700"
          >
            + New Year
          </button>
          {years.length > 1 && (
            <button
              onClick={() => setShowDelete(true)}
              className="px-2 py-1.5 text-sm text-red-500 hover:text-red-700"
            >
              Delete Year
            </button>
          )}
        </>
      )}
    </div>
  );
}
