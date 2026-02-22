import { Link, useLocation } from 'react-router-dom';
import YearSelector from './YearSelector';

interface Props {
  years: number[];
  selectedYear: number;
  onYearChange: (year: number) => void;
  onCreateYear: (year: number, cloneFrom?: number) => void;
  onDeleteYear: (year: number) => void;
  children: React.ReactNode;
}

const navItems = [
  { path: '/', label: 'Dashboard' },
  { path: '/forms', label: 'Forms' },
  { path: '/foreign-accounts', label: 'Foreign Accounts' },
  { path: '/checklist', label: 'Checklist' },
  { path: '/config', label: 'Config' },
];

export default function AppShell({ years, selectedYear, onYearChange, onCreateYear, onDeleteYear, children }: Props) {
  const location = useLocation();

  return (
    <div className="min-h-screen bg-gray-50">
      <nav className="bg-white border-b border-gray-200 px-4 py-3">
        <div className="max-w-7xl mx-auto flex items-center justify-between">
          <div className="flex items-center gap-8">
            <h1 className="text-lg font-bold text-gray-900">Tax Organizer</h1>
            <div className="flex gap-1">
              {navItems.map((item) => {
                const isActive =
                  item.path === '/'
                    ? location.pathname === '/'
                    : location.pathname.startsWith(item.path);
                return (
                  <Link
                    key={item.path}
                    to={item.path}
                    className={`px-3 py-1.5 rounded text-sm font-medium transition-colors ${
                      isActive
                        ? 'bg-blue-100 text-blue-700'
                        : 'text-gray-600 hover:text-gray-900 hover:bg-gray-100'
                    }`}
                  >
                    {item.label}
                  </Link>
                );
              })}
            </div>
          </div>
          <YearSelector
            years={years}
            selectedYear={selectedYear}
            onYearChange={onYearChange}
            onCreateYear={onCreateYear}
            onDeleteYear={onDeleteYear}
          />
        </div>
      </nav>
      <main className="max-w-7xl mx-auto px-4 py-6">{children}</main>
    </div>
  );
}
