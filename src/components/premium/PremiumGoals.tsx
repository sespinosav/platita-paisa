'use client';
import { useState, useEffect } from 'react';
import { Target, Plus, Trash2, TrendingUp, CheckCircle, Calendar, DollarSign } from 'lucide-react';
import { formatCurrency } from '@/lib/utils';

interface Goal {
  id: number;
  title: string;
  description: string;
  target_amount: number;
  current_amount: number;
  target_date: string;
  category: string;
  icon: string;
  color: string;
  is_completed: boolean;
  progress: number;
  daysLeft: number;
}

interface PremiumGoalsProps {
  token: string;
}

const goalCategories = [
  'Emergencias', 'Vacaciones', 'Educación', 'Tecnología', 
  'Transporte', 'Hogar', 'Salud', 'Inversión', 'Otros'
];

const availableIcons = ['🎯', '🏖️', '🎓', '💻', '🚗', '🏠', '💊', '📈', '⭐'];
const availableColors = [
  '#10B981', '#3B82F6', '#F59E0B', '#EF4444', 
  '#8B5CF6', '#06B6D4', '#84CC16', '#F97316'
];

export default function PremiumGoals({ token }: PremiumGoalsProps) {
  const [goals, setGoals] = useState<Goal[]>([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [contributeModal, setContributeModal] = useState<{
    show: boolean;
    goalId: number | null;
  }>({ show: false, goalId: null });
  
  const [formData, setFormData] = useState({
    title: '',
    description: '',
    targetAmount: '',
    targetDate: '',
    category: goalCategories[0],
    icon: availableIcons[0],
    color: availableColors[0]
  });
  
  const [contributionData, setContributionData] = useState({
    amount: '',
    description: ''
  });

  useEffect(() => {
    fetchGoals();
  }, []);

  const fetchGoals = async () => {
    try {
      const response = await fetch('/api/premium/goals', {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      
      if (response.ok) {
        const data = await response.json();
        setGoals(data.goals);
      }
    } catch (error) {
      console.error('Error fetching goals:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    try {
      const response = await fetch('/api/premium/goals', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          title: formData.title,
          description: formData.description,
          targetAmount: parseInt(formData.targetAmount),
          targetDate: formData.targetDate,
          category: formData.category,
          icon: formData.icon,
          color: formData.color
        })
      });
      
      if (response.ok) {
        setFormData({
          title: '',
          description: '',
          targetAmount: '',
          targetDate: '',
          category: goalCategories[0],
          icon: availableIcons[0],
          color: availableColors[0]
        });
        setShowForm(false);
        fetchGoals();
      }
    } catch (error) {
      console.error('Error creating goal:', error);
    }
  };

  const handleContribution = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!contributeModal.goalId) return;
    
    try {
      const response = await fetch(`/api/premium/goals/${contributeModal.goalId}/contribute`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          amount: parseInt(contributionData.amount),
          description: contributionData.description
        })
      });
      
      if (response.ok) {
        setContributionData({ amount: '', description: '' });
        setContributeModal({ show: false, goalId: null });
        fetchGoals();
      }
    } catch (error) {
      console.error('Error adding contribution:', error);
    }
  };

  const deleteGoal = async (goalId: number) => {
    if (!confirm('¿Estás seguro de eliminar este objetivo?')) return;
    
    try {
      const response = await fetch(`/api/premium/goals?id=${goalId}`, {
        method: 'DELETE',
        headers: { 'Authorization': `Bearer ${token}` }
      });
      
      if (response.ok) {
        fetchGoals();
      }
    } catch (error) {
      console.error('Error deleting goal:', error);
    }
  };

  const getDaysLeftColor = (daysLeft: number) => {
    if (daysLeft <= 7) return 'text-red-600';
    if (daysLeft <= 30) return 'text-yellow-600';
    return 'text-green-600';
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <div className="animate-spin rounded-full h-8 w-8 border-4 border-blue-500 border-t-transparent"></div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center space-x-3">
          <Target className="w-8 h-8 text-blue-600" />
          <div>
            <h2 className="text-2xl font-bold text-gray-800">Objetivos Financieros</h2>
            <p className="text-gray-600">Define y alcanza tus metas de ahorro</p>
          </div>
        </div>
        
        <button
          onClick={() => setShowForm(true)}
          className="cursor-pointer flex items-center space-x-2 bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition-colors"
        >
          <Plus className="w-5 h-5" />
          <span>Nuevo Objetivo</span>
        </button>
      </div>

      {/* Create Goal Form */}
      {showForm && (
        <div className="bg-white rounded-xl shadow-lg p-6">
          <h3 className="text-lg font-semibold text-gray-800 mb-4">Crear Objetivo</h3>
          
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Título del Objetivo
                </label>
                <input
                  type="text"
                  value={formData.title}
                  onChange={(e) => setFormData({...formData, title: e.target.value})}
                  className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  placeholder="Ej: Comprar casa, Viaje a Europa, etc."
                  required
                />
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Meta de Dinero
                </label>
                <input
                  type="number"
                  value={formData.targetAmount}
                  onChange={(e) => setFormData({...formData, targetAmount: e.target.value})}
                  className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  placeholder="0"
                  required
                />
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Fecha Límite
                </label>
                <input
                  type="date"
                  value={formData.targetDate}
                  onChange={(e) => setFormData({...formData, targetDate: e.target.value})}
                  className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  required
                />
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Categoría
                </label>
                <select
                  value={formData.category}
                  onChange={(e) => setFormData({...formData, category: e.target.value})}
                  className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  required
                >
                  {goalCategories.map(category => (
                    <option key={category} value={category}>{category}</option>
                  ))}
                </select>
              </div>
            </div>
            
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Descripción (opcional)
              </label>
              <textarea
                value={formData.description}
                onChange={(e) => setFormData({...formData, description: e.target.value})}
                className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                rows={3}
                placeholder="Describe tu objetivo..."
              />
            </div>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Ícono
                </label>
                <div className="grid grid-cols-5 gap-2">
                  {availableIcons.map((icon) => (
                    <button
                      key={icon}
                      type="button"
                      onClick={() => setFormData({...formData, icon})}
                      className={`cursor-pointer p-3 rounded-lg border-2 text-2xl hover:bg-gray-50 transition-colors ${
                        formData.icon === icon ? 'border-blue-500 bg-blue-50' : 'border-gray-200'
                      }`}
                    >
                      {icon}
                    </button>
                  ))}
                </div>
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Color
                </label>
                <div className="grid grid-cols-4 gap-2">
                  {availableColors.map((color) => (
                    <button
                      key={color}
                      type="button"
                      onClick={() => setFormData({...formData, color})}
                      className={`cursor-pointer w-12 h-12 rounded-lg border-2 transition-all ${
                        formData.color === color ? 'border-gray-800 scale-110' : 'border-gray-200'
                      }`}
                      style={{ backgroundColor: color }}
                    />
                  ))}
                </div>
              </div>
            </div>
            
            <div className="flex items-center space-x-4">
              <button
                type="submit"
                className="cursor-pointer bg-blue-600 text-white px-6 py-2 rounded-lg hover:bg-blue-700 transition-colors"
              >
                Crear Objetivo
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

      {/* Contribution Modal */}
      {contributeModal.show && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-xl shadow-xl p-6 w-full max-w-md mx-4">
            <h3 className="text-lg font-semibold text-gray-800 mb-4">
              Agregar Contribución
            </h3>
            
            <form onSubmit={handleContribution} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Monto a Aportar
                </label>
                <input
                  type="number"
                  value={contributionData.amount}
                  onChange={(e) => setContributionData({...contributionData, amount: e.target.value})}
                  className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  placeholder="0"
                  required
                />
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Descripción (opcional)
                </label>
                <input
                  type="text"
                  value={contributionData.description}
                  onChange={(e) => setContributionData({...contributionData, description: e.target.value})}
                  className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  placeholder="Motivo del aporte..."
                />
              </div>
              
              <div className="flex items-center space-x-4">
                <button
                  type="submit"
                  className="cursor-pointer bg-blue-600 text-white px-6 py-2 rounded-lg hover:bg-blue-700 transition-colors"
                >
                  Aportar
                </button>
                <button
                  type="button"
                  onClick={() => setContributeModal({ show: false, goalId: null })}
                  className="cursor-pointer text-gray-600 hover:text-gray-800 transition-colors"
                >
                  Cancelar
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Goals List */}
      {goals.length === 0 ? (
        <div className="bg-white rounded-xl shadow-lg p-12 text-center">
          <Target className="w-16 h-16 text-gray-300 mx-auto mb-4" />
          <h3 className="text-xl font-semibold text-gray-800 mb-2">
            No tienes objetivos aún
          </h3>
          <p className="text-gray-600 mb-6">
            Crea tu primer objetivo financiero para empezar a ahorrar con propósito
          </p>
          <button
            onClick={() => setShowForm(true)}
            className="cursor-pointer bg-blue-600 text-white px-6 py-3 rounded-lg hover:bg-blue-700 transition-colors"
          >
            Crear Mi Primer Objetivo
          </button>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {goals.map((goal) => (
            <div 
              key={goal.id} 
              className={`bg-white rounded-xl shadow-lg overflow-hidden ${
                goal.is_completed ? 'ring-2 ring-green-500' : ''
              }`}
              style={{ borderTop: `4px solid ${goal.color}` }}
            >
              <div className="p-6">
                <div className="flex items-center justify-between mb-4">
                  <div className="flex items-center space-x-3">
                    <span className="text-2xl">{goal.icon}</span>
                    <div>
                      <h3 className="text-lg font-semibold text-gray-800">
                        {goal.title}
                      </h3>
                      <span className="text-sm text-gray-500">{goal.category}</span>
                    </div>
                  </div>
                  <div className="flex items-center space-x-2">
                    {goal.is_completed && (
                      <CheckCircle className="w-5 h-5 text-green-500" />
                    )}
                    <button
                      onClick={() => deleteGoal(goal.id)}
                      className="cursor-pointer text-gray-400 hover:text-red-500 transition-colors"
                    >
                      <Trash2 className="w-5 h-5" />
                    </button>
                  </div>
                </div>
                
                {goal.description && (
                  <p className="text-sm text-gray-600 mb-4">{goal.description}</p>
                )}
                
                <div className="space-y-3 mb-4">
                  <div className="flex items-center justify-between">
                    <span className="text-sm text-gray-600">Ahorrado:</span>
                    <span className="font-medium" style={{ color: goal.color }}>
                      {formatCurrency(goal.current_amount)}
                    </span>
                  </div>
                  
                  <div className="flex items-center justify-between">
                    <span className="text-sm text-gray-600">Meta:</span>
                    <span className="font-medium">{formatCurrency(goal.target_amount)}</span>
                  </div>
                  
                  <div className="flex items-center justify-between">
                    <span className="text-sm text-gray-600">Falta:</span>
                    <span className="font-medium text-gray-800">
                      {formatCurrency(Math.max(0, goal.target_amount - goal.current_amount))}
                    </span>
                  </div>
                  
                  {/* Progress Bar */}
                  <div className="space-y-2">
                    <div className="flex items-center justify-between">
                      <span className="text-sm text-gray-600">Progreso:</span>
                      <span className="font-medium" style={{ color: goal.color }}>
                        {goal.progress}%
                      </span>
                    </div>
                    <div className="w-full bg-gray-200 rounded-full h-3">
                      <div
                        className="h-3 rounded-full transition-all"
                        style={{ 
                          backgroundColor: goal.color,
                          width: `${goal.progress}%` 
                        }}
                      ></div>
                    </div>
                  </div>
                  
                  {/* Time Left */}
                  <div className="flex items-center justify-between">
                    <span className="text-sm text-gray-600">Tiempo restante:</span>
                    <span className={`text-sm font-medium ${getDaysLeftColor(goal.daysLeft)}`}>
                      {goal.daysLeft > 0 ? `${goal.daysLeft} días` : 'Vencido'}
                    </span>
                  </div>
                </div>
                
                {/* Action Button */}
                {!goal.is_completed && (
                  <button
                    onClick={() => setContributeModal({ 
                      show: true, 
                      goalId: goal.id 
                    })}
                    className="cursor-pointer w-full flex items-center justify-center space-x-2 py-2 rounded-lg hover:bg-gray-50 transition-colors"
                    style={{ 
                      backgroundColor: `${goal.color}20`,
                      color: goal.color 
                    }}
                  >
                    <DollarSign className="w-4 h-4" />
                    <span className="text-sm font-medium">Contribuir</span>
                  </button>
                )}
                
                {goal.is_completed && (
                  <div className="w-full flex items-center justify-center space-x-2 bg-green-50 text-green-600 py-2 rounded-lg">
                    <CheckCircle className="w-4 h-4" />
                    <span className="text-sm font-medium">¡Objetivo Completado!</span>
                  </div>
                )}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
