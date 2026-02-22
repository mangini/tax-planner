import type { TaxYearData, ComputationResult } from '@shared/types';
import Dashboard from '../components/dashboard/Dashboard';

interface Props {
  data: TaxYearData | null;
  result: ComputationResult | null;
}

export default function DashboardPage({ data, result }: Props) {
  return (
    <div>
      <h1 className="text-2xl font-bold text-gray-900 mb-6">Dashboard</h1>
      <Dashboard data={data} result={result} />
    </div>
  );
}
