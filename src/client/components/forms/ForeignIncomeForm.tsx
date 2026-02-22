import { useState } from 'react';
import type { ForeignRentalIncomeData, ForeignBankIncomeData } from '@shared/types';
import MoneyInput from './MoneyInput';
import EstimateToggle from './EstimateToggle';
import FormEditor from './FormEditor';

interface Props {
  rentalData: ForeignRentalIncomeData | undefined;
  bankData: ForeignBankIncomeData | undefined;
  onSave: (data: { foreignRentalIncome?: ForeignRentalIncomeData; foreignBankIncome?: ForeignBankIncomeData }) => Promise<void>;
}

const defaultRental: ForeignRentalIncomeData = { country: '', grossIncome: 0, expenses: 0, netIncome: 0, foreignTaxPaid: 0 };
const defaultBank: ForeignBankIncomeData = { country: '', interestIncome: 0, dividendIncome: 0, capitalGains: 0, foreignTaxPaid: 0 };

export default function ForeignIncomeForm({ rentalData, bankData, onSave }: Props) {
  const [rental, setRental] = useState<ForeignRentalIncomeData>(rentalData || defaultRental);
  const [bank, setBank] = useState<ForeignBankIncomeData>(bankData || defaultBank);
  const [saving, setSaving] = useState(false);

  const handleSave = async () => {
    setSaving(true);
    await onSave({ foreignRentalIncome: rental, foreignBankIncome: bank });
    setSaving(false);
  };

  return (
    <FormEditor title="Foreign Income" onSave={handleSave} saving={saving}>
      <div className="space-y-4">
        <div className={`rounded-lg overflow-hidden border ${rental.isEstimate ? 'border-amber-200 bg-amber-50/20' : 'border-gray-100'}`}>
          <div className={`flex items-center justify-between px-4 py-2.5 ${rental.isEstimate ? 'bg-amber-50/60' : 'bg-gray-50'}`}>
            <h3 className="text-sm font-medium text-gray-700">Foreign Rental Income</h3>
            <EstimateToggle isEstimate={!!rental.isEstimate} onChange={(v) => setRental({ ...rental, isEstimate: v })} />
          </div>
          <div className="px-4 py-3 space-y-2">
            <input type="text" placeholder="Country" value={rental.country}
              onChange={(e) => setRental({ ...rental, country: e.target.value })}
              className="border border-gray-200 rounded px-3 py-1 text-sm w-48" />
            <div className="grid grid-cols-4 gap-3">
              <MoneyInput label="Gross Income" value={rental.grossIncome} estimated={rental.isEstimate} onChange={(v) => setRental({ ...rental, grossIncome: v })} />
              <MoneyInput label="Expenses" value={rental.expenses} estimated={rental.isEstimate} onChange={(v) => setRental({ ...rental, expenses: v })} />
              <MoneyInput label="Net Income" value={rental.netIncome} estimated={rental.isEstimate} onChange={(v) => setRental({ ...rental, netIncome: v })} />
              <MoneyInput label="Foreign Tax Paid" value={rental.foreignTaxPaid} estimated={rental.isEstimate} onChange={(v) => setRental({ ...rental, foreignTaxPaid: v })} />
            </div>
          </div>
        </div>

        <div className={`rounded-lg overflow-hidden border ${bank.isEstimate ? 'border-amber-200 bg-amber-50/20' : 'border-gray-100'}`}>
          <div className={`flex items-center justify-between px-4 py-2.5 ${bank.isEstimate ? 'bg-amber-50/60' : 'bg-gray-50'}`}>
            <h3 className="text-sm font-medium text-gray-700">Foreign Bank/Investment Income</h3>
            <EstimateToggle isEstimate={!!bank.isEstimate} onChange={(v) => setBank({ ...bank, isEstimate: v })} />
          </div>
          <div className="px-4 py-3 space-y-2">
            <input type="text" placeholder="Country" value={bank.country}
              onChange={(e) => setBank({ ...bank, country: e.target.value })}
              className="border border-gray-200 rounded px-3 py-1 text-sm w-48" />
            <div className="grid grid-cols-4 gap-3">
              <MoneyInput label="Interest Income" value={bank.interestIncome} estimated={bank.isEstimate} onChange={(v) => setBank({ ...bank, interestIncome: v })} />
              <MoneyInput label="Dividend Income" value={bank.dividendIncome} estimated={bank.isEstimate} onChange={(v) => setBank({ ...bank, dividendIncome: v })} />
              <MoneyInput label="Capital Gains" value={bank.capitalGains} estimated={bank.isEstimate} onChange={(v) => setBank({ ...bank, capitalGains: v })} />
              <MoneyInput label="Foreign Tax Paid" value={bank.foreignTaxPaid} estimated={bank.isEstimate} onChange={(v) => setBank({ ...bank, foreignTaxPaid: v })} />
            </div>
          </div>
        </div>
      </div>
    </FormEditor>
  );
}
