'use client';

import { History, TrendingUp, TrendingDown } from 'lucide-react';
import { formatCurrency } from '@/lib/utils';
import type { Transaction } from '@/lib/utils';

interface TransactionHistoryProps {
  transactions: Transaction[];
  onTransactionDeleted?: () => void;
  token: string;
}

// Función para convertir UTC a hora colombiana de forma simple y directa
function formatDateInColombianTime(utcDateString: string | null): string {
  if (!utcDateString) return '';
  
  try {
    // Crear fecha desde UTC
    const utcDate = new Date(utcDateString ?? '');
    if (isNaN(utcDate.getTime())) {
      return '';
    }
    // Usar toLocaleString para asegurar conversión a hora colombiana
    return utcDate.toLocaleString('es-CO', {
      timeZone: 'UTC',
      year: '2-digit',
      month: '2-digit',
      day: '2-digit',
      hour: '2-digit',
      minute: '2-digit',
      hour12: true
    });
  } catch (error) {
    console.error('Error formatting date:', error);
    return '';
  }
}

export default function TransactionHistory({ transactions, onTransactionDeleted, token }: TransactionHistoryProps) {
  const handleDelete = async (id: number) => {
    try {
      const response = await fetch(`/api/transactions?id=${id}`, {
        method: 'DELETE',
        headers: {
          'Authorization': `Bearer ${token}`,
        },
      });
      
      if (!response.ok) {
        throw new Error('Error eliminando transacción');
      }
      
      if (typeof onTransactionDeleted === 'function') {
        onTransactionDeleted();
      }
    } catch (error) {
      console.error('Error eliminando transacción:', error);
      // Aquí podrías mostrar un toast o notificación de error
    }
  };

  if (!transactions || transactions.length === 0) {
    return (
      <div className="bg-white rounded-xl shadow-lg p-6">
        <h2 className="text-2xl font-bold text-gray-800 mb-6 flex items-center">
          <History className="w-6 h-6 mr-2 text-blue-600" />
          Historial de Movimientos
        </h2>
        <p className="text-gray-500 text-center py-8">
          No hay transacciones para mostrar en este período
        </p>
      </div>
    );
  }

  return (
    <div className="bg-white rounded-xl shadow-lg p-6">
      <h2 className="text-2xl font-bold text-gray-800 mb-6 flex items-center">
        <History className="w-6 h-6 mr-2 text-blue-600" />
        Historial de Movimientos
      </h2>

      <ul className="space-y-4">
        {transactions.map((tx) => (
          <li key={tx.id} className="flex items-center justify-between p-3 border border-gray-100 rounded-lg hover:bg-gray-50 transition-colors">
            <div className="flex items-center">
              {tx.type === 'ingreso' ? (
                <TrendingUp className="w-5 h-5 text-green-500 mr-3 flex-shrink-0" />
              ) : (
                <TrendingDown className="w-5 h-5 text-red-500 mr-3 flex-shrink-0" />
              )}
              <div className="min-w-0 flex-1">
                <p className="font-medium text-gray-800 truncate">
                  {tx.description || tx.category}
                </p>
                <p className="text-sm font-semibold">
                  <span className={tx.type === 'ingreso' ? 'text-green-600' : 'text-red-600'}>
                    {tx.type === 'ingreso' ? '+' : '-'}{formatCurrency(tx.amount)}
                  </span>
                </p>
                <div className="flex items-center gap-2 text-xs text-gray-400">
                  <span className="bg-gray-100 px-2 py-1 rounded-full text-gray-600">
                    {tx.category}
                  </span>
                  <span>•</span>
                  <span className="font-mono">
                    {formatDateInColombianTime(tx.created_at)}
                  </span>
                </div>
              </div>
            </div>
            <button
              onClick={() => handleDelete(tx.id)}
              className="ml-4 px-3 py-1 text-xs text-red-600 border border-red-200 rounded-md hover:bg-red-50 hover:border-red-300 transition-colors flex-shrink-0"
              title="Eliminar transacción"
            >
              Eliminar
            </button>
          </li>
        ))}
      </ul>
      
      <div className="mt-4 text-xs text-gray-400 text-center">
        Mostrando {transactions.length} transacciones
      </div>
    </div>
  );
}