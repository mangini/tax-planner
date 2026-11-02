import type { ComputationResult, TaxYearData } from '@shared/types';
import TaxSummaryCard from './TaxSummaryCard';
import DeductionComparison from './DeductionComparison';
import TaxBreakdownChart from './TaxBreakdownChart';
import EstimateWarnings from './EstimateWarnings';
import FBARStatusCard from './FBARStatusCard';
import WithholdingRatesCard from './WithholdingRatesCard';
import EstimatedTaxCard from './EstimatedTaxCard';

interface Props {
  data: TaxYearData | null;
  result: ComputationResult | null;
}

export default function Dashboard({ data, result }: Props) {
  if (!result || !data) {
    return (
      <div className="text-center py-16 text-gray-500">
        No data yet. Go to Forms to start entering tax information.
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <TaxSummaryCard federal={result.federal} colorado={result.colorado} />
      <EstimatedTaxCard data={data} result={result} />
      <div className="grid grid-cols-2 gap-6">
        <DeductionComparison deductions={result.federal.deductions} />
        <TaxBreakdownChart federal={result.federal} colorado={result.colorado} />
      </div>
      <WithholdingRatesCard w2s={data.w2} />
      <div className="grid grid-cols-2 gap-6">
        <FBARStatusCard fbar={result.fbar} />
        <EstimateWarnings warnings={result.estimateWarnings} />
      </div>
    </div>
  );
}
