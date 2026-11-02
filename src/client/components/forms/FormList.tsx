import { Link } from 'react-router-dom';
import type { TaxYearData } from '@shared/types';

interface Props {
  data: TaxYearData | null;
}

interface FormInfo {
  key: string;
  label: string;
  subtitle: string;
  path: string;
  hasData: (d: TaxYearData) => boolean;
  hasEstimate: (d: TaxYearData) => boolean;
}

const forms: FormInfo[] = [
  { key: 'w2', label: 'W-2', subtitle: 'Wage and Tax Statement', path: 'w2', hasData: (d) => d.w2.length > 0, hasEstimate: (d) => d.w2.some((f) => f.isEstimate) },
  { key: '1099int', label: '1099-INT', subtitle: 'Interest Income', path: '1099int', hasData: (d) => d.form1099INT.length > 0, hasEstimate: (d) => d.form1099INT.some((f) => f.isEstimate) },
  { key: '1099div', label: '1099-DIV', subtitle: 'Dividend Income', path: '1099div', hasData: (d) => d.form1099DIV.length > 0, hasEstimate: (d) => d.form1099DIV.some((f) => f.isEstimate) },
  { key: '1099b', label: '1099-B', subtitle: 'Brokerage Proceeds', path: '1099b', hasData: (d) => d.form1099B.length > 0, hasEstimate: (d) => d.form1099B.some((f) => f.isEstimate) },
  { key: '1099g', label: '1099-G', subtitle: 'State Tax Refund', path: '1099g', hasData: (d) => d.form1099G.length > 0, hasEstimate: (d) => d.form1099G.some((f) => f.isEstimate) },
  { key: '1099r', label: '1099-R', subtitle: 'Retirement Distributions', path: '1099r', hasData: (d) => d.form1099R.length > 0, hasEstimate: (d) => d.form1099R.some((f) => f.isEstimate) },
  { key: '1098', label: '1098', subtitle: 'Mortgage Interest', path: '1098', hasData: (d) => d.form1098.length > 0, hasEstimate: (d) => d.form1098.some((f) => f.isEstimate) },
  { key: 'k1', label: 'Schedule K-1', subtitle: 'Partnership Income', path: 'k1', hasData: (d) => d.scheduleK1.length > 0, hasEstimate: (d) => d.scheduleK1.some((f) => f.isEstimate) },
  { key: 'foreign', label: 'Foreign Income', subtitle: 'Rental and Bank Income', path: 'foreign', hasData: (d) => !!d.foreignRentalIncome || !!d.foreignBankIncome, hasEstimate: (d) => !!d.foreignRentalIncome?.isEstimate || !!d.foreignBankIncome?.isEstimate },
  { key: 'hsa', label: 'HSA', subtitle: 'Health Savings Account', path: 'hsa', hasData: (d) => !!d.hsa, hasEstimate: (d) => !!d.hsa?.isEstimate },
  { key: 'charitable', label: 'Charitable', subtitle: 'Donations and Contributions', path: 'charitable', hasData: (d) => !!d.charitable, hasEstimate: (d) => !!d.charitable?.isEstimate },
  { key: 'rsu', label: 'RSU Grants', subtitle: 'Vesting Schedules', path: 'rsu', hasData: (d) => (d.rsuGrants?.length ?? 0) > 0, hasEstimate: () => false },
  { key: 'estimated', label: 'Estimated Payments', subtitle: 'Quarterly Tax Payments', path: 'estimated', hasData: (d) => !!d.estimatedPayments, hasEstimate: () => false },
  { key: 'filing', label: 'Filing Status', subtitle: 'Status and Dependents', path: 'filing', hasData: () => true, hasEstimate: () => false },
];

export default function FormList({ data }: Props) {
  if (!data) return <p className="text-gray-500">No data loaded.</p>;

  return (
    <div className="grid grid-cols-3 gap-4">
      {forms.map((f) => {
        const filled = f.hasData(data);
        const estimated = filled && f.hasEstimate(data);
        return (
          <Link
            key={f.key}
            to={`/forms/${f.path}`}
            className={`p-4 rounded-lg border-2 transition-colors ${
              filled
                ? 'border-green-300 bg-green-50 hover:border-green-400'
                : 'border-gray-200 bg-white hover:border-blue-300'
            }`}
          >
            <div className="flex items-center justify-between">
              <div>
                <span className="font-medium text-gray-900">{f.label}</span>
                <p className="text-xs text-gray-400">{f.subtitle}</p>
              </div>
              <div className="flex items-center gap-1.5">
                {estimated && (
                  <span className="text-xs px-2 py-0.5 rounded-full bg-amber-100 text-amber-700">
                    Estimated
                  </span>
                )}
                <span className={`text-xs px-2 py-0.5 rounded ${
                  filled ? 'bg-green-100 text-green-700' : 'bg-gray-100 text-gray-500'
                }`}>
                  {filled ? 'Has data' : 'Empty'}
                </span>
              </div>
            </div>
          </Link>
        );
      })}
    </div>
  );
}
