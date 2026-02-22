import { Routes, Route, Link, useLocation } from 'react-router-dom';
import type { TaxYearData } from '@shared/types';
import FormList from '../components/forms/FormList';
import W2Form from '../components/forms/W2Form';
import Form1099INT from '../components/forms/Form1099INT';
import Form1099DIV from '../components/forms/Form1099DIV';
import Form1099B from '../components/forms/Form1099B';
import Form1099G from '../components/forms/Form1099G';
import Form1099R from '../components/forms/Form1099R';
import Form1098 from '../components/forms/Form1098';
import ScheduleK1 from '../components/forms/ScheduleK1';
import ForeignIncomeForm from '../components/forms/ForeignIncomeForm';
import HSAForm from '../components/forms/HSAForm';
import CharitableForm from '../components/forms/CharitableForm';
import EstimatedPaymentsForm from '../components/forms/EstimatedPaymentsForm';
import FilingForm from '../components/forms/FilingForm';

interface Props {
  data: TaxYearData | null;
  year: number;
  onSave: (data: Partial<TaxYearData>) => Promise<void>;
  refresh: () => void;
}

const formLabels: Record<string, string> = {
  w2: 'W-2',
  '1099int': '1099-INT',
  '1099div': '1099-DIV',
  '1099b': '1099-B',
  '1099g': '1099-G',
  '1099r': '1099-R',
  '1098': '1098',
  k1: 'Schedule K-1',
  foreign: 'Foreign Income',
  hsa: 'HSA',
  charitable: 'Charitable',
  estimated: 'Estimated Payments',
  filing: 'Filing Status',
};

export default function FormsPage({ data, year, onSave, refresh }: Props) {
  const location = useLocation();
  const isIndex = location.pathname === '/forms' || location.pathname === '/forms/';
  const formSlug = location.pathname.split('/forms/')[1]?.replace(/\/$/, '');
  const formLabel = formSlug ? formLabels[formSlug] : undefined;

  if (!data) return <p className="text-gray-500">No data loaded.</p>;

  return (
    <div>
      <div className="flex items-center gap-4 mb-6">
        <h1 className="text-2xl font-bold text-gray-900">Tax Forms</h1>
        {formLabel && <span className="text-lg text-gray-400">/</span>}
        {formLabel && <span className="text-lg text-gray-600">{formLabel}</span>}
        {!isIndex && (
          <Link to="/forms" className="text-blue-600 hover:text-blue-700 text-sm">&larr; All Forms</Link>
        )}
      </div>
      <Routes>
        <Route index element={<FormList data={data} />} />
        <Route path="w2" element={<W2Form data={data.w2} onSave={onSave} />} />
        <Route path="1099int" element={<Form1099INT data={data.form1099INT} onSave={onSave} />} />
        <Route path="1099div" element={<Form1099DIV data={data.form1099DIV} onSave={onSave} />} />
        <Route path="1099b" element={<Form1099B data={data.form1099B} onSave={onSave} />} />
        <Route path="1099g" element={<Form1099G data={data.form1099G} onSave={onSave} />} />
        <Route path="1099r" element={<Form1099R data={data.form1099R} onSave={onSave} />} />
        <Route path="1098" element={<Form1098 data={data.form1098} onSave={onSave} />} />
        <Route path="k1" element={<ScheduleK1 data={data.scheduleK1} onSave={onSave} />} />
        <Route path="foreign" element={<ForeignIncomeForm rentalData={data.foreignRentalIncome} bankData={data.foreignBankIncome} onSave={onSave} />} />
        <Route path="hsa" element={<HSAForm data={data.hsa} onSave={onSave} />} />
        <Route path="charitable" element={<CharitableForm data={data.charitable} onSave={onSave} />} />
        <Route path="estimated" element={<EstimatedPaymentsForm data={data.estimatedPayments} onSave={onSave} />} />
        <Route path="filing" element={<FilingForm data={data.filing} onSave={onSave} />} />
      </Routes>
    </div>
  );
}
