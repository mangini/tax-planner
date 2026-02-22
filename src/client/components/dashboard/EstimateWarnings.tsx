import type { EstimateWarning } from '@shared/types';

interface Props {
  warnings: EstimateWarning[];
}

export default function EstimateWarnings({ warnings }: Props) {
  if (warnings.length === 0) return null;

  return (
    <div className="bg-amber-50 border border-amber-200 rounded-lg p-6">
      <h2 className="text-lg font-semibold text-amber-800 mb-3">
        Estimated Forms ({warnings.length})
      </h2>
      <p className="text-sm text-amber-700 mb-3">
        The following forms are still using estimated values. Update them when you receive final forms.
      </p>
      <div className="space-y-1">
        {warnings.map((w, i) => (
          <div key={i} className="text-sm text-amber-800">
            {w.form}
          </div>
        ))}
      </div>
    </div>
  );
}
