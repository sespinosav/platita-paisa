'use client';
import { useState, useEffect } from 'react';
import { LogOut, Wallet, TrendingUp, TrendingDown, Sparkles, Calendar, Filter, Users } from 'lucide-react';
import TransactionForm from '@/components/TransactionForm';
import TransactionHistory from '@/components/TransactionHistory';
import CategoryChart from '@/components/CategoryChart';
import { formatCurrency } from '@/lib/utils';
import type { Transaction } from '@/lib/utils';
import { GoTrueAdminApi } from '@supabase/supabase-js';
import GoToSharedAccountsButton from '@/components/GoToSharedAccountsButton';

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

type FilterPeriod = 'today' | 'week' | 'month' | 'year';

export default function Dashboard({ token, user, onLogout }: DashboardProps) {
  const [userCount, setUserCount] = useState<number | null>(null);
  const [selectedPeriod, setSelectedPeriod] = useState<FilterPeriod>('today');

  const filterOptions = [
    { value: 'today' as FilterPeriod, label: 'Hoy', icon: '🔥' },
    { value: 'week' as FilterPeriod, label: 'Semana', icon: '🌀' },
    { value: 'month' as FilterPeriod, label: 'Mes', icon: '🗓️' },
    { value: 'year' as FilterPeriod, label: 'Año', icon: '🏆' }
  ];

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

  const fetchData = async (period: FilterPeriod = selectedPeriod) => {
    try {
      const [balanceResponse, transactionsResponse] = await Promise.all([
        fetch(`/api/balance?period=${period}`, {
          headers: { 'Authorization': `Bearer ${token}` }
        }),
        fetch(`/api/transactions?period=${period}`, {
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

  useEffect(() => {
    fetchData(selectedPeriod);
  }, [selectedPeriod]);

  const handleTransactionAdded = () => {
    fetchData();
  };

  const handlePeriodChange = (period: FilterPeriod) => {
    setSelectedPeriod(period);
    setLoading(true);
  };

  const getPeriodLabel = () => {
    const option = filterOptions.find(opt => opt.value === selectedPeriod);
    return option ? option.label : 'Hoy';
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
          {/* Mobile Header */}
          <div className="flex flex-col space-y-3 py-4 sm:hidden">
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-3">
                <Sparkles className="w-7 h-7 text-yellow-500" />
                <div>
                  <h1 className="text-xl font-bold text-gray-900">Platita Paisa</h1>
                  <p className="text-sm text-gray-600">¡Hola, {user.username}!</p>
                </div>
              </div>
              <button
                onClick={onLogout}
                className="cursor-pointer p-2 text-gray-700 hover:text-red-600 transition-colors"
              >
                <LogOut className="w-5 h-5" />
              </button>
            </div>
            
            {/* Mobile Info and Actions */}
            <div className="flex flex-col space-y-2">
              {userCount !== null && (
                <span className="text-xs text-purple-600 font-semibold text-center">
                  ¡Ya somos {userCount} parceros!
                </span>
              )}
              <a
                href="/shared-accounts"
                className="cursor-pointer inline-flex items-center justify-center space-x-2 bg-gradient-to-r from-purple-500 to-pink-500 text-white px-4 py-3 rounded-lg hover:from-purple-600 hover:to-pink-600 transition-all shadow-lg text-sm font-medium w-full"
              >
                <Users className="w-4 h-4" />
                <span>El Parche 🎉</span>
              </a>
            </div>
          </div>

          {/* Desktop Header */}
          <div className="hidden sm:flex justify-between items-center py-4">
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
            
            <div className="flex items-center space-x-4">
              <a
                href="/shared-accounts"
                className="cursor-pointer inline-flex items-center space-x-2 bg-gradient-to-r from-purple-500 to-pink-500 text-white px-4 py-2 rounded-lg hover:from-purple-600 hover:to-pink-600 transition-all shadow-lg font-medium"
              >
                <Users className="w-5 h-5" />
                <span>El Parche 🎉</span>
              </a>
              <button
                onClick={onLogout}
                className="cursor-pointer flex items-center space-x-2 px-4 py-2 text-gray-700 hover:text-red-600 transition-colors"
              >
                <LogOut className="w-5 h-5" />
                <span>Salir</span>
              </button>
            </div>
          </div>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Filtros de Período */}
        <div className="mb-8">
          <div className="bg-white rounded-xl shadow-lg p-6">
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center space-x-2">
                <Filter className="w-5 h-5 text-blue-600" />
                <h2 className="text-lg font-semibold text-gray-800">Filtrar por período</h2>
              </div>
              <div className="flex items-center space-x-2 text-sm text-gray-600">
                <Calendar className="w-4 h-4" />
                <span>Mostrando datos de: <strong>{getPeriodLabel()}</strong></span>
              </div>
            </div>

            <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
              {filterOptions.map((option) => (
                <button
                  key={option.value}
                  onClick={() => handlePeriodChange(option.value)}
                  className={`
                    cursor-pointer relative flex items-center justify-center space-x-2 p-3 rounded-lg font-medium transition-all duration-200
                    ${selectedPeriod === option.value
                      ? 'bg-gradient-to-r from-blue-500 to-purple-600 text-white shadow-lg transform scale-105'
                      : 'bg-gray-50 text-gray-700 hover:bg-gray-100 hover:shadow-md'
                    }
                  `}
                >
                  <span className="text-lg">{option.icon}</span>
                  <span className="font-semibold">{option.label}</span>
                  {selectedPeriod === option.value && (
                    <div className="absolute -top-1 -right-1 w-3 h-3 bg-yellow-400 rounded-full animate-pulse"></div>
                  )}
                </button>
              ))}
            </div>
          </div>
        </div>

        {/* Balance Cards */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
          <div className="bg-gradient-to-r from-green-400 to-blue-500 rounded-xl shadow-lg p-6 text-white transform hover:scale-105 transition-transform">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-green-100 text-sm font-medium">Balance Total</p>
                <p className="text-3xl font-bold">
                  {formatCurrency(balanceData.balance)}
                </p>
                <p className="text-xs text-green-100 mt-1">
                  Período: {getPeriodLabel()}
                </p>
              </div>
              <Wallet className="w-10 h-10 text-green-100" />
            </div>
          </div>

          <div className="bg-white rounded-xl shadow-lg p-6 transform hover:scale-105 transition-transform">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-gray-600 text-sm font-medium">Ingresos</p>
                <p className="text-2xl font-bold text-green-600">
                  {formatCurrency(balanceData.ingresos)}
                </p>
                <p className="text-xs text-gray-500 mt-1">
                  {getPeriodLabel()}
                </p>
              </div>
              <TrendingUp className="w-8 h-8 text-green-500" />
            </div>
          </div>

          <div className="bg-white rounded-xl shadow-lg p-6 transform hover:scale-105 transition-transform">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-gray-600 text-sm font-medium">Gastos</p>
                <p className="text-2xl font-bold text-red-600">
                  {formatCurrency(balanceData.gastos)}
                </p>
                <p className="text-xs text-gray-500 mt-1">
                  {getPeriodLabel()}
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
              filterPeriod={selectedPeriod}
            />
          </div>

          {/* Gráfica de categorías */}
          <div>
            <CategoryChart
              categoryData={balanceData.categoryData}
            />
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

        <GoToSharedAccountsButton />
      </main>
    </div>
  );
}