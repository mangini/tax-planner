import { PieChart, Pie, Cell, Tooltip, ResponsiveContainer, Legend } from 'recharts';
import type { FederalTaxBreakdown, ColoradoTaxBreakdown } from '@shared/types';

interface Props {
  federal: FederalTaxBreakdown;
  colorado: ColoradoTaxBreakdown;
}

const COLORS = ['#3b82f6', '#8b5cf6', '#ef4444', '#f59e0b', '#10b981', '#6366f1'];

function fmt(n: number): string {
  return n.toLocaleString('en-US', { style: 'currency', currency: 'USD', maximumFractionDigits: 0 });
}

export default function TaxBreakdownChart({ federal, colorado }: Props) {
  const data = [
    { name: 'Ordinary Tax', value: federal.ordinaryTax },
    { name: 'Cap Gains Tax', value: federal.capitalGainsTax },
    { name: 'AMT', value: federal.amt },
    { name: 'NIIT', value: federal.niit },
    { name: 'Addl Medicare', value: federal.additionalMedicareTax },
    { name: 'Colorado', value: colorado.coloradoTax },
  ].filter((d) => d.value > 0);

  if (data.length === 0) {
    return (
      <div className="bg-white rounded-lg border border-gray-200 p-6">
        <h2 className="text-lg font-semibold text-gray-900 mb-4">Tax Breakdown</h2>
        <p className="text-gray-500 text-sm">No tax computed yet.</p>
      </div>
    );
  }

  return (
    <div className="bg-white rounded-lg border border-gray-200 p-6">
      <h2 className="text-lg font-semibold text-gray-900 mb-4">Tax Breakdown</h2>
      <ResponsiveContainer width="100%" height={300}>
        <PieChart>
          <Pie
            data={data}
            cx="50%"
            cy="50%"
            outerRadius={100}
            dataKey="value"
            label={({ name, value }) => `${name}: ${fmt(value)}`}
          >
            {data.map((_entry, index) => (
              <Cell key={index} fill={COLORS[index % COLORS.length]} />
            ))}
          </Pie>
          <Tooltip formatter={(value: number) => fmt(value)} />
        </PieChart>
      </ResponsiveContainer>
    </div>
  );
}
