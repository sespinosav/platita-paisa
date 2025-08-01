'use client';
import { useState, useEffect } from 'react';
import { BarChart3, TrendingUp, TrendingDown, Calendar, DollarSign, Target, Activity, Eye } from 'lucide-react';
import { formatCurrency } from '@/lib/utils';
import { PieChart, Pie, Cell, BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, LineChart, Line, Area, AreaChart } from 'recharts';

interface Statistics {
  summary: {
    currentIncome: number;
    currentExpenses: number;
    currentSavings: number;
    incomeChange: number;
    expenseChange: number;
    savingsChange: number;
    savingsRate: number;
  };
  categoryAnalysis: Array<{
    category: string;
    current: number;
    previous: number;
    change: number;
    trend: 'increasing' | 'decreasing' | 'stable';
  }>;
  spendingPatterns: {
    avgDailySpending: number;
    dayOfWeekAnalysis: Array<{
      day: string;
      amount: number;
    }>;
    totalTransactions: number;
  } | null;
  projections: {
    projectedExpenses: number;
    projectedIncome: number;
    projectedSavings: number;
    dailyAvgExpenses: number;
    dailyAvgIncome: number;
  } | null;
  period: string;
}

interface PremiumStatisticsProps {
  token: string;
}

const COLORS = ['#10B981', '#3B82F6', '#F59E0B', '#EF4444', '#8B5CF6', '#06B6D4', '#84CC16', '#F97316'];

export default function PremiumStatistics({ token }: PremiumStatisticsProps) {
  const [statistics, setStatistics] = useState<Statistics | null>(null);
  const [loading, setLoading] = useState(true);
  const [selectedPeriod, setSelectedPeriod] = useState('month');
  const [activeView, setActiveView] = useState<'overview' | 'categories' | 'patterns' | 'projections'>('overview');

  useEffect(() => {
    fetchStatistics();
  }, [selectedPeriod]);

  const fetchStatistics = async () => {
    setLoading(true);
    try {
      const response = await fetch(`/api/premium/statistics?period=${selectedPeriod}`, {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      
      if (response.ok) {
        const data = await response.json();
        setStatistics(data.stats);
      }
    } catch (error) {
      console.error('Error fetching statistics:', error);
    } finally {
      setLoading(false);
    }
  };

  const periods = [
    { value: 'week', label: 'Semana' },
    { value: 'month', label: 'Mes' },
    { value: 'year', label: 'Año' }
  ];

  const views = [
    { id: 'overview', label: 'Resumen', icon: Eye },
    { id: 'categories', label: 'Categorías', icon: BarChart3 },
    { id: 'patterns', label: 'Patrones', icon: Activity },
    { id: 'projections', label: 'Proyecciones', icon: Target }
  ];

  const getTrendIcon = (change: number) => {
    if (change > 0) return <TrendingUp className="w-4 h-4 text-green-500" />;
    if (change < 0) return <TrendingDown className="w-4 h-4 text-red-500" />;
    return <div className="w-4 h-4 bg-gray-400 rounded-full"></div>;
  };

  const getTrendColor = (change: number) => {
    if (change > 0) return 'text-green-600';
    if (change < 0) return 'text-red-600';
    return 'text-gray-600';
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <div className="animate-spin rounded-full h-8 w-8 border-4 border-blue-500 border-t-transparent"></div>
      </div>
    );
  }

  if (!statistics) {
    return (
      <div className="bg-white rounded-xl shadow-lg p-12 text-center">
        <BarChart3 className="w-16 h-16 text-gray-300 mx-auto mb-4" />
        <h3 className="text-xl font-semibold text-gray-800 mb-2">
          No hay datos suficientes
        </h3>
        <p className="text-gray-600">
          Necesitas más transacciones para generar estadísticas detalladas
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center space-x-3">
          <BarChart3 className="w-8 h-8 text-blue-600" />
          <div>
            <h2 className="text-2xl font-bold text-gray-800">Estadísticas Avanzadas</h2>
            <p className="text-gray-600">Análisis profundo de tus finanzas</p>
          </div>
        </div>
        
        <div className="flex items-center space-x-4">
          <select
            value={selectedPeriod}
            onChange={(e) => setSelectedPeriod(e.target.value)}
            className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
          >
            {periods.map(period => (
              <option key={period.value} value={period.value}>{period.label}</option>
            ))}
          </select>
        </div>
      </div>

      {/* View Navigation */}
      <div className="bg-white rounded-xl shadow-lg p-6">
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          {views.map((view) => {
            const Icon = view.icon;
            const isActive = activeView === view.id;
            
            return (
              <button
                key={view.id}
                onClick={() => setActiveView(view.id as any)}
                className={`
                  cursor-pointer flex items-center justify-center space-x-2 p-3 rounded-lg transition-all
                  ${isActive
                    ? 'bg-blue-500 text-white shadow-lg'
                    : 'bg-gray-50 text-gray-700 hover:bg-gray-100'
                  }
                `}
              >
                <Icon className="w-5 h-5" />
                <span className="font-medium">{view.label}</span>
              </button>
            );
          })}
        </div>
      </div>

      {/* Overview */}
      {activeView === 'overview' && (
        <div className="space-y-6">
          {/* Summary Cards */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            <div className="bg-white rounded-xl shadow-lg p-6">
              <div className="flex items-center justify-between mb-2">
                <h3 className="text-sm font-medium text-gray-600">Ingresos</h3>
                {getTrendIcon(statistics.summary.incomeChange)}
              </div>
              <p className="text-2xl font-bold text-green-600">
                {formatCurrency(statistics.summary.currentIncome)}
              </p>
              <p className={`text-sm ${getTrendColor(statistics.summary.incomeChange)}`}>
                {statistics.summary.incomeChange > 0 ? '+' : ''}{statistics.summary.incomeChange.toFixed(1)}% vs período anterior
              </p>
            </div>

            <div className="bg-white rounded-xl shadow-lg p-6">
              <div className="flex items-center justify-between mb-2">
                <h3 className="text-sm font-medium text-gray-600">Gastos</h3>
                {getTrendIcon(-statistics.summary.expenseChange)}
              </div>
              <p className="text-2xl font-bold text-red-600">
                {formatCurrency(statistics.summary.currentExpenses)}
              </p>
              <p className={`text-sm ${getTrendColor(-statistics.summary.expenseChange)}`}>
                {statistics.summary.expenseChange > 0 ? '+' : ''}{statistics.summary.expenseChange.toFixed(1)}% vs período anterior
              </p>
            </div>

            <div className="bg-white rounded-xl shadow-lg p-6">
              <div className="flex items-center justify-between mb-2">
                <h3 className="text-sm font-medium text-gray-600">Ahorros</h3>
                {getTrendIcon(statistics.summary.savingsChange)}
              </div>
              <p className={`text-2xl font-bold ${statistics.summary.currentSavings >= 0 ? 'text-blue-600' : 'text-red-600'}`}>
                {formatCurrency(statistics.summary.currentSavings)}
              </p>
              <p className={`text-sm ${getTrendColor(statistics.summary.savingsChange)}`}>
                {statistics.summary.savingsChange > 0 ? '+' : ''}{statistics.summary.savingsChange.toFixed(1)}% vs período anterior
              </p>
            </div>

            <div className="bg-white rounded-xl shadow-lg p-6">
              <div className="flex items-center justify-between mb-2">
                <h3 className="text-sm font-medium text-gray-600">Tasa de Ahorro</h3>
                <Target className="w-4 h-4 text-purple-500" />
              </div>
              <p className="text-2xl font-bold text-purple-600">
                {statistics.summary.savingsRate}%
              </p>
              <p className="text-sm text-gray-500">
                De tus ingresos totales
              </p>
            </div>
          </div>

          {/* Savings Rate Chart */}
          <div className="bg-white rounded-xl shadow-lg p-6">
            <h3 className="text-lg font-semibold text-gray-800 mb-4">Distribución Financiera</h3>
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              <div className="h-64">
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Pie
                      data={[
                        { name: 'Gastos', value: statistics.summary.currentExpenses, color: '#EF4444' },
                        { name: 'Ahorros', value: Math.max(0, statistics.summary.currentSavings), color: '#10B981' }
                      ]}
                      cx="50%"
                      cy="50%"
                      outerRadius={80}
                      dataKey="value"
                      label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}
                    >
                      {[
                        { name: 'Gastos', value: statistics.summary.currentExpenses, color: '#EF4444' },
                        { name: 'Ahorros', value: Math.max(0, statistics.summary.currentSavings), color: '#10B981' }
                      ].map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={entry.color} />
                      ))}
                    </Pie>
                    <Tooltip formatter={(value) => formatCurrency(value as number)} />
                  </PieChart>
                </ResponsiveContainer>
              </div>
              
              <div className="flex flex-col justify-center space-y-4">
                <div className="p-4 bg-green-50 rounded-lg">
                  <h4 className="font-semibold text-green-800 mb-2">Recomendación Paisa 💡</h4>
                  <p className="text-green-700 text-sm">
                    {statistics.summary.savingsRate >= 20 
                      ? "¡Excelente! Estás ahorrando como todo un paisa. Sigue así."
                      : statistics.summary.savingsRate >= 10
                      ? "Vas bien, parce. Trata de aumentar un poquito más el ahorro."
                      : "¡Ojo! Tratá de ahorrar al menos el 10% de tus ingresos."}
                  </p>
                </div>
                
                <div className="space-y-2">
                  <div className="flex justify-between items-center">
                    <span className="text-sm text-gray-600">Meta de ahorro recomendada:</span>
                    <span className="font-medium text-blue-600">20%</span>
                  </div>
                  <div className="w-full bg-gray-200 rounded-full h-2">
                    <div
                      className="bg-blue-500 h-2 rounded-full transition-all"
                      style={{ width: `${Math.min((statistics.summary.savingsRate / 20) * 100, 100)}%` }}
                    ></div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Category Analysis */}
      {activeView === 'categories' && statistics.categoryAnalysis.length > 0 && (
        <div className="space-y-6">
          <div className="bg-white rounded-xl shadow-lg p-6">
            <h3 className="text-lg font-semibold text-gray-800 mb-4">Análisis por Categorías</h3>
            
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              <div className="h-80">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={statistics.categoryAnalysis.slice(0, 8)}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis 
                      dataKey="category" 
                      angle={-45}
                      textAnchor="end"
                      height={80}
                    />
                    <YAxis tickFormatter={(value) => `$${(value / 1000).toFixed(0)}K`} />
                    <Tooltip formatter={(value) => formatCurrency(value as number)} />
                    <Bar dataKey="current" fill="#3B82F6" name="Período actual" />
                    <Bar dataKey="previous" fill="#94A3B8" name="Período anterior" />
                  </BarChart>
                </ResponsiveContainer>
              </div>
              
              <div className="space-y-4">
                <h4 className="font-semibold text-gray-800">Tendencias por Categoría</h4>
                <div className="space-y-3 max-h-64 overflow-y-auto">
                  {statistics.categoryAnalysis.map((category, index) => (
                    <div key={category.category} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                      <div className="flex items-center space-x-3">
                        <div 
                          className="w-3 h-3 rounded-full" 
                          style={{ backgroundColor: COLORS[index % COLORS.length] }}
                        ></div>
                        <span className="font-medium text-gray-800">{category.category}</span>
                      </div>
                      <div className="flex items-center space-x-2">
                        <span className="text-sm text-gray-600">{formatCurrency(category.current)}</span>
                        <div className={`flex items-center space-x-1 ${getTrendColor(category.change)}`}>
                          {getTrendIcon(category.change)}
                          <span className="text-sm font-medium">
                            {Math.abs(category.change).toFixed(1)}%
                          </span>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Spending Patterns */}
      {activeView === 'patterns' && statistics.spendingPatterns && (
        <div className="space-y-6">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <div className="bg-white rounded-xl shadow-lg p-6">
              <h3 className="text-lg font-semibold text-gray-800 mb-4">Gastos por Día de la Semana</h3>
              <div className="h-64">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={statistics.spendingPatterns.dayOfWeekAnalysis}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="day" />
                    <YAxis tickFormatter={(value) => `$${(value / 1000).toFixed(0)}K`} />
                    <Tooltip formatter={(value) => formatCurrency(value as number)} />
                    <Bar dataKey="amount" fill="#8B5CF6" />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </div>
            
            <div className="bg-white rounded-xl shadow-lg p-6">
              <h3 className="text-lg font-semibold text-gray-800 mb-4">Resumen de Patrones</h3>
              <div className="space-y-4">
                <div className="p-4 bg-purple-50 rounded-lg">
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-sm font-medium text-purple-800">Gasto Promedio Diario</span>
                    <DollarSign className="w-4 h-4 text-purple-600" />
                  </div>
                  <p className="text-2xl font-bold text-purple-600">
                    {formatCurrency(statistics.spendingPatterns.avgDailySpending)}
                  </p>
                </div>
                
                <div className="p-4 bg-blue-50 rounded-lg">
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-sm font-medium text-blue-800">Total de Transacciones</span>
                    <Activity className="w-4 h-4 text-blue-600" />
                  </div>
                  <p className="text-2xl font-bold text-blue-600">
                    {statistics.spendingPatterns.totalTransactions}
                  </p>
                </div>
                
                <div className="p-4 bg-green-50 rounded-lg">
                  <h4 className="font-semibold text-green-800 mb-2">💡 Insights Paisa</h4>
                  <p className="text-green-700 text-sm">
                    {(() => {
                      const maxDay = statistics.spendingPatterns.dayOfWeekAnalysis.reduce((prev, current) => 
                        (prev.amount > current.amount) ? prev : current
                      );
                      return `Gastas más los ${maxDay.day.toLowerCase()}. ¡Ojo con esos días!`;
                    })()}
                  </p>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Projections */}
      {activeView === 'projections' && statistics.projections && (
        <div className="space-y-6">
          <div className="bg-white rounded-xl shadow-lg p-6">
            <h3 className="text-lg font-semibold text-gray-800 mb-4">Proyecciones para este {selectedPeriod === 'week' ? 'Semana' : selectedPeriod === 'month' ? 'Mes' : 'Año'}</h3>
            
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              <div className="p-6 bg-green-50 rounded-lg">
                <div className="flex items-center justify-between mb-2">
                  <h4 className="font-semibold text-green-800">Ingresos Proyectados</h4>
                  <TrendingUp className="w-5 h-5 text-green-600" />
                </div>
                <p className="text-2xl font-bold text-green-600">
                  {formatCurrency(statistics.projections.projectedIncome)}
                </p>
                <p className="text-sm text-green-700 mt-1">
                  ~{formatCurrency(statistics.projections.dailyAvgIncome)} por día
                </p>
              </div>
              
              <div className="p-6 bg-red-50 rounded-lg">
                <div className="flex items-center justify-between mb-2">
                  <h4 className="font-semibold text-red-800">Gastos Proyectados</h4>
                  <TrendingDown className="w-5 h-5 text-red-600" />
                </div>
                <p className="text-2xl font-bold text-red-600">
                  {formatCurrency(statistics.projections.projectedExpenses)}
                </p>
                <p className="text-sm text-red-700 mt-1">
                  ~{formatCurrency(statistics.projections.dailyAvgExpenses)} por día
                </p>
              </div>
              
              <div className="p-6 bg-blue-50 rounded-lg">
                <div className="flex items-center justify-between mb-2">
                  <h4 className="font-semibold text-blue-800">Ahorro Proyectado</h4>
                  <Target className="w-5 h-5 text-blue-600" />
                </div>
                <p className={`text-2xl font-bold ${statistics.projections.projectedSavings >= 0 ? 'text-blue-600' : 'text-red-600'}`}>
                  {formatCurrency(statistics.projections.projectedSavings)}
                </p>
                <p className="text-sm text-blue-700 mt-1">
                  Basado en tendencia actual
                </p>
              </div>
            </div>
            
            <div className="mt-6 p-4 bg-yellow-50 rounded-lg">
              <h4 className="font-semibold text-yellow-800 mb-2">🎯 Recomendación Estratégica</h4>
              <p className="text-yellow-700 text-sm">
                {statistics.projections.projectedSavings >= 0 
                  ? "¡Excelente! Si mantienes este ritmo, tendrás un buen ahorro al final del período."
                  : "¡Cuidado! Según tu tendencia actual, podrías estar gastando más de lo que generas. Considera ajustar tus gastos."
                }
              </p>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
