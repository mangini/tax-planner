import { Routes, Route, Navigate } from 'react-router-dom';
import { useState, useEffect, useCallback } from 'react';
import AppShell from './components/layout/AppShell';
import DashboardPage from './pages/DashboardPage';
import FormsPage from './pages/FormsPage';
import ForeignAccountsPage from './pages/ForeignAccountsPage';
import ChecklistPage from './pages/ChecklistPage';
import ConfigPage from './pages/ConfigPage';
import * as api from './api';
import type { TaxYearData, ComputationResult, YearConfig } from '@shared/types';

export default function App() {
  const [years, setYears] = useState<number[]>([]);
  const [selectedYear, setSelectedYear] = useState<number>(2025);
  const [data, setData] = useState<TaxYearData | null>(null);
  const [result, setResult] = useState<ComputationResult | null>(null);
  const [config, setConfig] = useState<YearConfig | null>(null);
  const [loading, setLoading] = useState(true);

  const loadYear = useCallback(async (year: number) => {
    setLoading(true);
    try {
      const [d, r, c] = await Promise.all([
        api.getYearData(year),
        api.computeTax(year),
        api.getYearConfig(year),
      ]);
      setData(d);
      setResult(r);
      setConfig(c);
    } catch {
      // Year might not exist yet
      setData(null);
      setResult(null);
      setConfig(null);
    }
    setLoading(false);
  }, []);

  const refresh = useCallback(() => {
    if (selectedYear) loadYear(selectedYear);
  }, [selectedYear, loadYear]);

  useEffect(() => {
    api.listYears().then((yrs) => {
      setYears(yrs);
      if (yrs.length > 0) {
        const year = yrs.includes(2025) ? 2025 : yrs[yrs.length - 1];
        setSelectedYear(year);
        loadYear(year);
      } else {
        // Auto-create 2025
        api.createYear(2025).then(() => {
          setYears([2025]);
          setSelectedYear(2025);
          loadYear(2025);
        });
      }
    });
  }, [loadYear]);

  const handleYearChange = (year: number) => {
    setSelectedYear(year);
    loadYear(year);
  };

  const handleCreateYear = async (year: number, cloneFrom?: number) => {
    await api.createYear(year, cloneFrom);
    const yrs = await api.listYears();
    setYears(yrs);
    setSelectedYear(year);
    loadYear(year);
  };

  const handleDeleteYear = async (year: number) => {
    await api.deleteYear(year);
    const yrs = await api.listYears();
    setYears(yrs);
    if (yrs.length > 0) {
      const next = yrs[yrs.length - 1];
      setSelectedYear(next);
      loadYear(next);
    } else {
      setData(null);
      setResult(null);
      setConfig(null);
    }
  };

  const handleSaveData = async (partial: Partial<TaxYearData>) => {
    const updated = await api.updateYearData(selectedYear, partial);
    setData(updated);
    // Re-compute
    const r = await api.computeTax(selectedYear);
    setResult(r);
  };

  const handleSaveConfig = async (partial: Partial<YearConfig>) => {
    const updated = await api.updateYearConfig(selectedYear, partial);
    setConfig(updated);
    const r = await api.computeTax(selectedYear);
    setResult(r);
  };

  const handleResetConfig = async () => {
    const updated = await api.resetYearConfig(selectedYear);
    setConfig(updated);
    const r = await api.computeTax(selectedYear);
    setResult(r);
  };

  return (
    <AppShell
      years={years}
      selectedYear={selectedYear}
      onYearChange={handleYearChange}
      onCreateYear={handleCreateYear}
      onDeleteYear={handleDeleteYear}
    >
      {loading ? (
        <div className="flex items-center justify-center h-64">
          <div className="text-gray-500">Loading...</div>
        </div>
      ) : (
        <Routes>
          <Route
            path="/"
            element={<DashboardPage data={data} result={result} />}
          />
          <Route
            path="/forms/*"
            element={
              <FormsPage
                data={data}
                year={selectedYear}
                onSave={handleSaveData}
                refresh={refresh}
              />
            }
          />
          <Route
            path="/foreign-accounts"
            element={
              <ForeignAccountsPage
                data={data}
                year={selectedYear}
                result={result}
                onSave={handleSaveData}
                refresh={refresh}
              />
            }
          />
          <Route
            path="/checklist"
            element={
              <ChecklistPage data={data} onSave={handleSaveData} />
            }
          />
          <Route
            path="/config"
            element={
              <ConfigPage
                config={config}
                onSave={handleSaveConfig}
                onReset={handleResetConfig}
              />
            }
          />
          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      )}
    </AppShell>
  );
}
