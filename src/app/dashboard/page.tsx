'use client';

import { useState, useEffect } from 'react';
import { LogOut, Wallet, TrendingUp, TrendingDown, Sparkles } from 'lucide-react';
import TransactionForm from '@/components/TransactionForm';
import TransactionHistory from '@/components/TransactionHistory';
import CategoryChart from '@/components/CategoryChart';
import { formatCurrency } from '@/lib/utils';
import type { Transaction } from '@/lib/utils';

interface DashboardProps {
  token: string;
  user: any;
  onLogout: () => void;
}

interface BalanceData {
  balance: number;
  ingresos: number;
  gastos: number;
  categoryData: any[];
}

export default function Dashboard({ token, user, onLogout }: DashboardProps) {
  const [userCount, setUserCount] = useState<number | null>(null);
  const tips = [
    "Pana, recordá que cada pesito cuenta. ¡Ahorrar de a poquito también suma!",
    "No gastés en lo que no necesitás, así te rinde más la platica.",
    "Buscá siempre el mejor precio, ¡ser paisa es ser negociante!",
    "Invertí en vos mismo, la mejor platica es la que te hace crecer.",
    "Pagá tus deudas a tiempo, así dormís tranquilo.",
    "Llevá control de tus gastos, el que no lleva cuentas, pierde la cuenta.",
    "Ahorrá para los imprevistos, nunca se sabe cuándo toca apretarse el cinturón."
  ];
  const todayTip = tips[new Date().getDay()];
  const [balanceData, setBalanceData] = useState<BalanceData>({
    balance: 0,
    ingresos: 0,
    gastos: 0,
    categoryData: []
  });
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchData = async () => {
    try {
      const [balanceResponse, transactionsResponse] = await Promise.all([
        fetch('/api/balance', {
          headers: { 'Authorization': `Bearer ${token}` }
        }),
        fetch('/api/transactions', {
          headers: { 'Authorization': `Bearer ${token}` }
        })
      ]);

      const balanceData = await balanceResponse.json();
      const transactionsData = await transactionsResponse.json();

      setBalanceData(balanceData);
      setTransactions(transactionsData.transactions || []);
    } catch (error) {
      console.error('Error fetching data:', error);
    } finally {
      setLoading(false);
    }
  };


  useEffect(() => {
    fetchData();
    // Obtener cantidad de usuarios
    fetch('/api/auth', {
      headers: { 'Authorization': `Bearer ${token}` }
    })
      .then(res => res.json())
      .then(data => {
        if (typeof data.count === 'number') {
          setUserCount(data.count);
        } else {
          setUserCount(null);
        }
      })
      .catch(() => setUserCount(null));
  }, [token]);

  const handleTransactionAdded = () => {
    fetchData();
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-4 border-blue-500 border-t-transparent"></div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100">
      {/* Header */}
      <header className="bg-white shadow-sm border-b">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center py-4">
            <div className="flex items-center space-x-3">
              <Sparkles className="w-8 h-8 text-yellow-500" />
              <div>
                <h1 className="text-2xl font-bold text-gray-900">Platita Paisa</h1>
                <p className="text-sm text-gray-600">¡Hola, {user.username}!</p>
                {userCount !== null && (
                  <span className="text-xs text-purple-600 font-semibold block mt-1">
                    ¡Ya somos {userCount} parceros usando la plataforma!
                  </span>
                )}
              </div>
            </div>
            <button
              onClick={onLogout}
              className="flex items-center space-x-2 px-4 py-2 text-gray-700 hover:text-red-600 transition-colors"
            >
              <LogOut className="w-5 h-5" />
              <span>Salir</span>
            </button>
          </div>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Balance Cards */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
          <div className="bg-gradient-to-r from-green-400 to-blue-500 rounded-xl shadow-lg p-6 text-white">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-green-100 text-sm font-medium">Balance Total</p>
                <p className="text-3xl font-bold">
                  {formatCurrency(balanceData.balance)}
                </p>
              </div>
              <Wallet className="w-10 h-10 text-green-100" />
            </div>
          </div>

          <div className="bg-white rounded-xl shadow-lg p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-gray-600 text-sm font-medium">Ingresos</p>
                <p className="text-2xl font-bold text-green-600">
                  {formatCurrency(balanceData.ingresos)}
                </p>
              </div>
              <TrendingUp className="w-8 h-8 text-green-500" />
            </div>
          </div>

          <div className="bg-white rounded-xl shadow-lg p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-gray-600 text-sm font-medium">Gastos</p>
                <p className="text-2xl font-bold text-red-600">
                  {formatCurrency(balanceData.gastos)}
                </p>
              </div>
              <TrendingDown className="w-8 h-8 text-red-500" />
            </div>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          {/* Formulario de transacciones */}
          <div className="space-y-8">
            <TransactionForm 
              token={token} 
              onTransactionAdded={handleTransactionAdded} 
            />
            
            <TransactionHistory 
              transactions={transactions} 
              token={token} 
              onTransactionDeleted={fetchData} 
            />
          </div>

          {/* Gráfica de categorías */}
          <div>
            <CategoryChart categoryData={balanceData.categoryData} />
          </div>
        </div>

        {/* Tips paisa */}
        <div className="mt-8 bg-yellow-50 border-l-4 border-yellow-400 p-6 rounded-r-xl">
          <div className="flex items-start">
            <div className="flex-shrink-0">
              <span className="text-2xl">💡</span>
            </div>
            <div className="ml-3">
              <h3 className="text-lg font-medium text-yellow-800">
                Tip Paisa del día
              </h3>
              <p className="mt-1 text-yellow-700">
                {`"${todayTip}"`}
              </p>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}