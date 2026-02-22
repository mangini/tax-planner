import type { TaxYearData, ComputationResult } from '@shared/types';
import FBARTracker from '../components/foreign/FBARTracker';

interface Props {
  data: TaxYearData | null;
  year: number;
  result: ComputationResult | null;
  onSave: (data: Partial<TaxYearData>) => Promise<void>;
  refresh: () => void;
}

export default function ForeignAccountsPage({ data, year, result, onSave, refresh }: Props) {
  return (
    <div>
      <h1 className="text-2xl font-bold text-gray-900 mb-6">Foreign Accounts</h1>
      <FBARTracker data={data} result={result} onSave={onSave} />
    </div>
  );
}
