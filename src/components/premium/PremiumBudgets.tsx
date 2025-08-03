'use client';
import { useState, useEffect } from 'react';
import { Calendar, Plus, Trash2, AlertTriangle } from 'lucide-react';
import { formatCurrency, defaultCategories } from '@/lib/utils';
import ConfirmModal from '@/components/ConfirmModal';

interface Budget {
  id: number;
  category: string;
  amount: number;
  period: string;
  start_date: string;
  end_date: string;
  spent: number;
  remaining: number;
  progress: number;
}

interface PremiumBudgetsProps {
  token: string;
}

// Función para traducir períodos
const translatePeriod = (period: string): string => {
  const translations: { [key: string]: string } = {
    'weekly': 'Semanal',
    'monthly': 'Mensual',
    'yearly': 'Anual'
  };
  return translations[period] || period;
};

export default function PremiumBudgets({ token }: PremiumBudgetsProps) {
  const [budgets, setBudgets] = useState<Budget[]>([]);
  const [userCategories, setUserCategories] = useState<string[]>([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [budgetToDelete, setBudgetToDelete] = useState<Budget | null>(null);
  const [formData, setFormData] = useState({
    category: '',
    amount: '',
    period: 'monthly',
    startDate: '',
    endDate: ''
  });

  useEffect(() => {
    fetchBudgets();
    fetchUserCategories();
  }, []);

  const fetchBudgets = async () => {
    try {
      const response = await fetch('/api/premium/budgets', {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      
      if (response.ok) {
        const data = await response.json();
        setBudgets(data.budgets);
      }
    } catch (error) {
      console.error('Error fetching budgets:', error);
    } finally {
      setLoading(false);
    }
  };

  const fetchUserCategories = async () => {
    try {
      const response = await fetch('/api/categories', {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      
      if (response.ok) {
        const data = await response.json();
        setUserCategories(data.categories || []);
      }
    } catch (error) {
      console.error('Error fetching user categories:', error);
    }
  };

  // Combinar categorías predefinidas con las del usuario, eliminando duplicados
  const getAllCategories = () => {
    const allCategories = [...defaultCategories, ...userCategories];
    return [...new Set(allCategories)].sort();
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    try {
      const response = await fetch('/api/premium/budgets', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          category: formData.category,
          amount: parseInt(formData.amount),
          period: formData.period,
          startDate: formData.startDate,
          endDate: formData.endDate
        })
      });
      
      if (response.ok) {
        setFormData({
          category: '',
          amount: '',
          period: 'monthly',
          startDate: '',
          endDate: ''
        });
        setShowForm(false);
        fetchBudgets();
      }
    } catch (error) {
      console.error('Error creating budget:', error);
    }
  };

  const deleteBudget = async (budget: Budget) => {
    setBudgetToDelete(budget);
    setShowDeleteConfirm(true);
  };

  const confirmDeleteBudget = async () => {
    if (!budgetToDelete) return;
    
    try {
      const response = await fetch(`/api/premium/budgets?id=${budgetToDelete.id}`, {
        method: 'DELETE',
        headers: { 'Authorization': `Bearer ${token}` }
      });
      
      if (response.ok) {
        fetchBudgets();
      }
    } catch (error) {
      console.error('Error deleting budget:', error);
    } finally {
      setBudgetToDelete(null);
      setShowDeleteConfirm(false);
    }
  };

  const getBudgetStatus = (budget: Budget) => {
    if (budget.progress >= 100) return 'exceeded';
    if (budget.progress >= 80) return 'warning';
    return 'good';
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'exceeded': return 'text-red-600';
      case 'warning': return 'text-yellow-600';
      default: return 'text-green-600';
    }
  };

  const getProgressBarColor = (status: string) => {
    switch (status) {
      case 'exceeded': return 'bg-red-500';
      case 'warning': return 'bg-yellow-500';
      default: return 'bg-green-500';
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <div className="animate-spin rounded-full h-8 w-8 border-4 border-purple-500 border-t-transparent"></div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center space-x-3">
          <Calendar className="w-8 h-8 text-purple-600" />
          <div>
            <h2 className="text-2xl font-bold text-gray-800">Presupuestos</h2>
            <p className="text-gray-600">Controla tus gastos por categoría</p>
          </div>
        </div>
        
        <button
          onClick={() => setShowForm(true)}
          className="cursor-pointer flex items-center space-x-2 bg-purple-600 text-white px-4 py-2 rounded-lg hover:bg-purple-700 transition-colors"
        >
          <Plus className="w-5 h-5" />
          <span>Nuevo Presupuesto</span>
        </button>
      </div>

      {/* Create Budget Form */}
      {showForm && (
        <div className="bg-white rounded-xl shadow-lg p-6">
          <h3 className="text-lg font-semibold text-gray-800 mb-4">Crear Presupuesto</h3>
          
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Categoría
                </label>
                <select
                  value={formData.category}
                  onChange={(e) => setFormData({...formData, category: e.target.value})}
                  className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                  required
                >
                  <option value="">Seleccionar categoría</option>
                  {/* Categorías predefinidas */}
                  <optgroup label="Categorías Predefinidas">
                    {defaultCategories.map(category => (
                      <option key={`default-${category}`} value={category}>{category}</option>
                    ))}
                  </optgroup>
                  {/* Categorías del usuario */}
                  {userCategories.length > 0 && (
                    <optgroup label="Mis Categorías Personalizadas">
                      {userCategories
                        .filter(category => !defaultCategories.includes(category))
                        .map(category => (
                          <option key={`user-${category}`} value={category}>
                            {category} 👤
                          </option>
                        ))}
                    </optgroup>
                  )}
                </select>
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Monto Presupuestado
                </label>
                <input
                  type="number"
                  value={formData.amount}
                  onChange={(e) => setFormData({...formData, amount: e.target.value})}
                  className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                  placeholder="0"
                  required
                />
                {formData.amount && parseInt(formData.amount) > 0 && (
                  <p className="mt-2 text-sm text-gray-600 font-medium">
                    💰 {formatCurrency(parseInt(formData.amount))}
                  </p>
                )}
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Período
                </label>
                <select
                  value={formData.period}
                  onChange={(e) => setFormData({...formData, period: e.target.value})}
                  className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                  required
                >
                  <option value="weekly">Semanal</option>
                  <option value="monthly">Mensual</option>
                  <option value="yearly">Anual</option>
                </select>
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Fecha de Inicio
                </label>
                <input
                  type="date"
                  value={formData.startDate}
                  onChange={(e) => setFormData({...formData, startDate: e.target.value})}
                  className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                  required
                />
              </div>
              
              <div className="md:col-span-1">
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Fecha de Fin
                </label>
                <input
                  type="date"
                  value={formData.endDate}
                  onChange={(e) => setFormData({...formData, endDate: e.target.value})}
                  className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                  required
                />
              </div>
            </div>
            
            <div className="flex items-center space-x-4">
              <button
                type="submit"
                className="cursor-pointer bg-purple-600 text-white px-6 py-2 rounded-lg hover:bg-purple-700 transition-colors"
              >
                Crear Presupuesto
              </button>
              <button
                type="button"
                onClick={() => setShowForm(false)}
                className="cursor-pointer text-gray-600 hover:text-gray-800 transition-colors"
              >
                Cancelar
              </button>
            </div>
          </form>
        </div>
      )}

      {/* Budgets List */}
      {budgets.length === 0 ? (
        <div className="bg-white rounded-xl shadow-lg p-12 text-center">
          <Calendar className="w-16 h-16 text-gray-300 mx-auto mb-4" />
          <h3 className="text-xl font-semibold text-gray-800 mb-2">
            No tienes presupuestos aún
          </h3>
          <p className="text-gray-600 mb-6">
            Crea tu primer presupuesto para empezar a controlar tus gastos
          </p>
          <button
            onClick={() => setShowForm(true)}
            className="cursor-pointer bg-purple-600 text-white px-6 py-3 rounded-lg hover:bg-purple-700 transition-colors"
          >
            Crear Mi Primer Presupuesto
          </button>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {budgets.map((budget) => {
            const status = getBudgetStatus(budget);
            const statusColor = getStatusColor(status);
            const progressBarColor = getProgressBarColor(status);
            
            return (
              <div key={budget.id} className="bg-white rounded-xl shadow-lg p-6">
                <div className="flex items-center justify-between mb-4">
                  <h3 className="text-lg font-semibold text-gray-800">
                    {budget.category}
                  </h3>
                  <button
                    onClick={() => deleteBudget(budget)}
                    className="cursor-pointer text-gray-400 hover:text-red-500 transition-colors"
                  >
                    <Trash2 className="w-5 h-5" />
                  </button>
                </div>
                
                <div className="space-y-3">
                  <div className="flex items-center justify-between">
                    <span className="text-sm text-gray-600">Presupuesto:</span>
                    <span className="font-medium">{formatCurrency(budget.amount)}</span>
                  </div>
                  
                  <div className="flex items-center justify-between">
                    <span className="text-sm text-gray-600">Gastado:</span>
                    <span className={`font-medium ${statusColor}`}>
                      {formatCurrency(budget.spent)}
                    </span>
                  </div>
                  
                  <div className="flex items-center justify-between">
                    <span className="text-sm text-gray-600">Restante:</span>
                    <span className={`font-medium ${budget.remaining >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                      {formatCurrency(budget.remaining)}
                    </span>
                  </div>
                  
                  {/* Progress Bar */}
                  <div className="space-y-2">
                    <div className="flex items-center justify-between">
                      <span className="text-sm text-gray-600">Progreso:</span>
                      <span className={`font-medium ${statusColor}`}>
                        {budget.progress}%
                      </span>
                    </div>
                    <div className="w-full bg-gray-200 rounded-full h-2">
                      <div
                        className={`h-2 rounded-full transition-all ${progressBarColor}`}
                        style={{ width: `${Math.min(budget.progress, 100)}%` }}
                      ></div>
                    </div>
                  </div>
                  
                  {/* Status Indicators */}
                  {status === 'exceeded' && (
                    <div className="flex items-center space-x-2 text-red-600">
                      <AlertTriangle className="w-4 h-4" />
                      <span className="text-sm font-medium">¡Presupuesto excedido!</span>
                    </div>
                  )}
                  
                  {status === 'warning' && (
                    <div className="flex items-center space-x-2 text-yellow-600">
                      <AlertTriangle className="w-4 h-4" />
                      <span className="text-sm font-medium">Cerca del límite</span>
                    </div>
                  )}
                  
                  <div className="text-xs text-gray-500 pt-2 border-t">
                    Período: {translatePeriod(budget.period)} | {new Date(budget.start_date).toLocaleDateString('es-CO')} - {new Date(budget.end_date).toLocaleDateString('es-CO')}
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Modal de confirmación para eliminar presupuesto */}
      <ConfirmModal
        isOpen={showDeleteConfirm}
        onClose={() => {
          setShowDeleteConfirm(false);
          setBudgetToDelete(null);
        }}
        onConfirm={confirmDeleteBudget}
        title="Eliminar Presupuesto"
        message={budgetToDelete ? 
          `¿Estás seguro de que deseas eliminar el presupuesto de "${budgetToDelete.category}"? Esta acción no se puede deshacer.` : 
          '¿Estás seguro de que deseas eliminar este presupuesto?'
        }
        confirmText="Eliminar"
        cancelText="Cancelar"
        type="danger"
        icon={<Trash2 className="h-6 w-6 text-red-600" />}
      />
    </div>
  );
}
