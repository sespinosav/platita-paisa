export function formatCurrency(amount: number): string {
  return new Intl.NumberFormat('es-CO', {
    style: 'currency',
    currency: 'COP',
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(amount);
}

export function formatNumber(amount: number): string {
  return new Intl.NumberFormat('es-CO').format(amount);
}

export const defaultCategories = [
  'Comida', 'Transporte', 'Entretenimiento', 'Salud', 'Educación',
  'Ropa', 'Hogar', 'Servicios', 'Ahorro', 'Trabajo', 'Otros'
];

export type TransactionType = 'ingreso' | 'gasto';

export interface Transaction {
  id: number;
  type: TransactionType;
  amount: number;
  category: string;
  description?: string;
  created_at: string;
  isFromSharedAccount?: boolean;
}

export interface User {
  id: number;
  username: string;
}