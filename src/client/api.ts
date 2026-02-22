import type { TaxYearData, YearConfig, ComputationResult, ForeignAccountData } from '@shared/types';

const BASE = '/api';

async function request<T>(url: string, options?: RequestInit): Promise<T> {
  const res = await fetch(`${BASE}${url}`, {
    headers: { 'Content-Type': 'application/json' },
    ...options,
  });
  if (!res.ok) {
    const err = await res.json().catch(() => ({ error: res.statusText }));
    throw new Error(err.error || res.statusText);
  }
  if (res.status === 204) return undefined as T;
  return res.json();
}

// Years
export const listYears = () => request<number[]>('/years');
export const createYear = (year: number, cloneFrom?: number) =>
  request<TaxYearData>('/years', {
    method: 'POST',
    body: JSON.stringify({ year, cloneFrom }),
  });
export const deleteYear = (year: number) =>
  request<void>(`/years/${year}`, { method: 'DELETE' });

// Tax Data
export const getYearData = (year: number) =>
  request<TaxYearData>(`/years/${year}/data`);
export const updateYearData = (year: number, data: Partial<TaxYearData>) =>
  request<TaxYearData>(`/years/${year}/data`, {
    method: 'PATCH',
    body: JSON.stringify(data),
  });
export const replaceYearData = (year: number, data: TaxYearData) =>
  request<TaxYearData>(`/years/${year}/data`, {
    method: 'PUT',
    body: JSON.stringify(data),
  });

// Forms
export const getForm = <T>(year: number, form: string) =>
  request<T>(`/years/${year}/forms/${form}`);
export const updateForm = <T>(year: number, form: string, data: T) =>
  request<T>(`/years/${year}/forms/${form}`, {
    method: 'PUT',
    body: JSON.stringify(data),
  });

// Config
export const getYearConfig = (year: number) =>
  request<YearConfig>(`/years/${year}/config`);
export const updateYearConfig = (year: number, config: Partial<YearConfig>) =>
  request<YearConfig>(`/years/${year}/config`, {
    method: 'PATCH',
    body: JSON.stringify(config),
  });
export const resetYearConfig = (year: number) =>
  request<YearConfig>(`/years/${year}/config/reset`, { method: 'POST' });

// Compute
export const computeTax = (year: number) =>
  request<ComputationResult>(`/years/${year}/compute`);

// Foreign Accounts
export const getForeignAccounts = (year: number) =>
  request<ForeignAccountData[]>(`/years/${year}/foreign-accounts`);
export const addForeignAccount = (year: number, account: ForeignAccountData) =>
  request<ForeignAccountData>(`/years/${year}/foreign-accounts`, {
    method: 'POST',
    body: JSON.stringify(account),
  });
export const updateForeignAccount = (year: number, id: string, account: ForeignAccountData) =>
  request<ForeignAccountData>(`/years/${year}/foreign-accounts/${id}`, {
    method: 'PUT',
    body: JSON.stringify(account),
  });
export const deleteForeignAccount = (year: number, id: string) =>
  request<void>(`/years/${year}/foreign-accounts/${id}`, { method: 'DELETE' });
