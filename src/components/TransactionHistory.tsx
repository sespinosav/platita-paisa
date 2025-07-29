'use client';

import { History, TrendingUp, TrendingDown } from 'lucide-react';
import { formatCurrency } from '@/lib/utils';
import type { Transaction } from '@/lib/utils';

interface TransactionHistoryProps {
  transactions: Transaction[];
  onTransactionDeleted?: () => void;
  token: string;
}

export default function TransactionHistory({ transactions, onTransactionDeleted, token }: TransactionHistoryProps) {
  const handleDelete = async (id: number) => {
    try {
      await fetch(`/api/transactions?id=${id}`, {
        method: 'DELETE',
        headers: {
          'Authorization': `Bearer ${token}`,
        },
      });
      if (typeof onTransactionDeleted === 'function') {
        onTransactionDeleted();
      }
    } catch (error) {
      console.error('Error eliminando transacción:', error);
    }
  };

  return (
    <div className="bg-white rounded-xl shadow-lg p-6">
      <h2 className="text-2xl font-bold text-gray-800 mb-6 flex items-center">
        <History className="w-6 h-6 mr-2 text-blue-600" />
        Historial de Movimientos
      </h2>

      <ul className="space-y-4">
        {transactions.map((tx) => (
          <li key={tx.id} className="flex items-center justify-between">
            <div className="flex items-center">
              {tx.type === 'ingreso' ? (
                <TrendingUp className="w-5 h-5 text-green-500 mr-2" />
              ) : (
                <TrendingDown className="w-5 h-5 text-red-500 mr-2" />
              )}
              <div>
                <p className="font-medium text-gray-800">{tx.description}</p>
                <p className="text-sm text-gray-600">
                  {formatCurrency(tx.amount)}
                </p>
                <p className="text-xs text-gray-400">
                  {tx.created_at ? new Date(tx.created_at).toLocaleString('es-CO', { dateStyle: 'short', timeStyle: 'short' }) : ''}
                </p>
              </div>
            </div>
            <button
              onClick={() => handleDelete(tx.id)}
              className="ml-4 px-2 py-1 text-xs text-red-600 border border-red-200 rounded hover:bg-red-50 transition"
              title="Eliminar transacción"
            >
              Eliminar
            </button>
          </li>
        ))}
      </ul>
    </div>
  );
}