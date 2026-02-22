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
      <div className="space-y-6">
        <div className={`border rounded p-4 ${rental.isEstimate ? 'border-amber-300 bg-amber-50/30' : 'border-gray-200'}`}>
          <div className="flex justify-between items-center mb-3">
            <h3 className="text-sm font-semibold text-gray-700">Foreign Rental Income</h3>
            <EstimateToggle isEstimate={!!rental.isEstimate} onChange={(v) => setRental({ ...rental, isEstimate: v })} />
          </div>
          <div className="space-y-3">
            <input type="text" placeholder="Country" value={rental.country}
              onChange={(e) => setRental({ ...rental, country: e.target.value })}
              className="border border-gray-300 rounded px-3 py-1.5 text-sm w-full" />
            <div className="grid grid-cols-2 gap-4">
              <MoneyInput label="Gross Income" value={rental.grossIncome} estimated={rental.isEstimate} onChange={(v) => setRental({ ...rental, grossIncome: v })} />
              <MoneyInput label="Expenses" value={rental.expenses} estimated={rental.isEstimate} onChange={(v) => setRental({ ...rental, expenses: v })} />
              <MoneyInput label="Net Income" value={rental.netIncome} estimated={rental.isEstimate} onChange={(v) => setRental({ ...rental, netIncome: v })} />
              <MoneyInput label="Foreign Tax Paid" value={rental.foreignTaxPaid} estimated={rental.isEstimate} onChange={(v) => setRental({ ...rental, foreignTaxPaid: v })} />
            </div>
          </div>
        </div>

        <div className={`border rounded p-4 ${bank.isEstimate ? 'border-amber-300 bg-amber-50/30' : 'border-gray-200'}`}>
          <div className="flex justify-between items-center mb-3">
            <h3 className="text-sm font-semibold text-gray-700">Foreign Bank/Investment Income</h3>
            <EstimateToggle isEstimate={!!bank.isEstimate} onChange={(v) => setBank({ ...bank, isEstimate: v })} />
          </div>
          <div className="space-y-3">
            <input type="text" placeholder="Country" value={bank.country}
              onChange={(e) => setBank({ ...bank, country: e.target.value })}
              className="border border-gray-300 rounded px-3 py-1.5 text-sm w-full" />
            <div className="grid grid-cols-2 gap-4">
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
