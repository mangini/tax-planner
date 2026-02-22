import type { FederalTaxBreakdown, ColoradoTaxBreakdown } from '@shared/types';

interface Props {
  federal: FederalTaxBreakdown;
  colorado: ColoradoTaxBreakdown;
}

function fmt(n: number): string {
  return n.toLocaleString('en-US', { style: 'currency', currency: 'USD', maximumFractionDigits: 0 });
}

function pct(n: number): string {
  return (n * 100).toFixed(1) + '%';
}

export default function TaxSummaryCard({ federal, colorado }: Props) {
  const totalTax = federal.totalTax + colorado.coloradoTax;
  const totalBalance = federal.balanceDue + colorado.coloradoBalanceDue;

  return (
    <div className="bg-white rounded-lg border border-gray-200 p-6">
      <h2 className="text-lg font-semibold text-gray-900 mb-4">Tax Summary</h2>

      <div className="grid grid-cols-2 gap-6">
        {/* Federal */}
        <div>
          <h3 className="text-sm font-medium text-gray-500 uppercase tracking-wide mb-3">Federal</h3>
          <div className="space-y-2 text-sm">
            <Row label="Gross Income" value={fmt(federal.grossIncome)} />
            <Row label="AGI" value={fmt(federal.agi)} />
            <Row label="Taxable Income" value={fmt(federal.taxableIncome)} />
            <hr className="border-gray-100" />
            <Row label="Ordinary Tax" value={fmt(federal.ordinaryTax)} />
            <Row label="Capital Gains Tax" value={fmt(federal.capitalGainsTax)} />
            {federal.amt > 0 && <Row label="AMT" value={fmt(federal.amt)} />}
            {federal.niit > 0 && <Row label="NIIT" value={fmt(federal.niit)} />}
            {federal.additionalMedicareTax > 0 && <Row label="Addl Medicare" value={fmt(federal.additionalMedicareTax)} />}
            <hr className="border-gray-100" />
            {federal.childTaxCredit > 0 && <Row label="Child Tax Credit" value={`-${fmt(federal.childTaxCredit)}`} className="text-green-600" />}
            {federal.foreignTaxCredit > 0 && <Row label="Foreign Tax Credit" value={`-${fmt(federal.foreignTaxCredit)}`} className="text-green-600" />}
            <hr className="border-gray-100" />
            <Row label="Total Federal Tax" value={fmt(federal.totalTax)} bold />
            <Row label="Withholding" value={fmt(federal.totalWithholding)} />
            {federal.totalEstimatedPayments > 0 && <Row label="Est. Payments" value={fmt(federal.totalEstimatedPayments)} />}
            <Row
              label="Balance Due"
              value={fmt(federal.balanceDue)}
              bold
              className={federal.balanceDue <= 0 ? 'text-green-600' : 'text-red-600'}
            />
          </div>
        </div>

        {/* Colorado */}
        <div>
          <h3 className="text-sm font-medium text-gray-500 uppercase tracking-wide mb-3">Colorado</h3>
          <div className="space-y-2 text-sm">
            <Row label="Taxable Income" value={fmt(colorado.coloradoTaxableIncome)} />
            <Row label="Colorado Tax" value={fmt(colorado.coloradoTax)} bold />
            <Row label="Withholding" value={fmt(colorado.coloradoWithholding)} />
            {colorado.coloradoEstimatedPayments > 0 && <Row label="Est. Payments" value={fmt(colorado.coloradoEstimatedPayments)} />}
            <Row
              label="Balance Due"
              value={fmt(colorado.coloradoBalanceDue)}
              bold
              className={colorado.coloradoBalanceDue <= 0 ? 'text-green-600' : 'text-red-600'}
            />
          </div>

          <div className="mt-8 p-4 bg-gray-50 rounded-lg">
            <h3 className="text-sm font-medium text-gray-500 uppercase tracking-wide mb-3">Combined</h3>
            <div className="space-y-2 text-sm">
              <Row label="Total Tax" value={fmt(totalTax)} bold />
              <Row
                label="Total Balance"
                value={fmt(totalBalance)}
                bold
                className={totalBalance <= 0 ? 'text-green-600' : 'text-red-600'}
              />
              <Row label="Effective Rate" value={pct(federal.effectiveRate)} />
              <Row label="Marginal Rate" value={pct(federal.marginalRate)} />
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

function Row({ label, value, bold, className }: { label: string; value: string; bold?: boolean; className?: string }) {
  return (
    <div className={`flex justify-between ${className || ''}`}>
      <span className={bold ? 'font-semibold' : 'text-gray-600'}>{label}</span>
      <span className={bold ? 'font-semibold' : ''}>{value}</span>
    </div>
  );
}
