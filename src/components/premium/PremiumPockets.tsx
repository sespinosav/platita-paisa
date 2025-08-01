'use client';
import { useState, useEffect } from 'react';
import { PiggyBank, Plus, Trash2, TrendingUp, Minus } from 'lucide-react';
import { formatCurrency } from '@/lib/utils';

interface Pocket {
  id: number;
  name: string;
  description: string;
  target_amount: number;
  current_amount: number;
  color: string;
  icon: string;
}

interface PremiumPocketsProps {
  token: string;
}

const availableIcons = ['🎯', '🏠', '🚗', '🎓', '✈️', '💻', '🎮', '👕', '💍', '🎸'];
const availableColors = [
  '#3B82F6', '#10B981', '#F59E0B', '#EF4444', 
  '#8B5CF6', '#06B6D4', '#84CC16', '#F97316'
];

export default function PremiumPockets({ token }: PremiumPocketsProps) {
  const [pockets, setPockets] = useState<Pocket[]>([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [transactionModal, setTransactionModal] = useState<{
    show: boolean;
    pocketId: number | null;
    type: 'deposit' | 'withdraw';
  }>({ show: false, pocketId: null, type: 'deposit' });
  
  const [formData, setFormData] = useState({
    name: '',
    description: '',
    targetAmount: '',
    color: availableColors[0],
    icon: availableIcons[0]
  });
  
  const [transactionData, setTransactionData] = useState({
    amount: '',
    description: ''
  });

  useEffect(() => {
    fetchPockets();
  }, []);

  const fetchPockets = async () => {
    try {
      const response = await fetch('/api/premium/pockets', {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      
      if (response.ok) {
        const data = await response.json();
        setPockets(data.pockets);
      }
    } catch (error) {
      console.error('Error fetching pockets:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    try {
      const response = await fetch('/api/premium/pockets', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          name: formData.name,
          description: formData.description,
          targetAmount: parseInt(formData.targetAmount),
          color: formData.color,
          icon: formData.icon
        })
      });
      
      if (response.ok) {
        setFormData({
          name: '',
          description: '',
          targetAmount: '',
          color: availableColors[0],
          icon: availableIcons[0]
        });
        setShowForm(false);
        fetchPockets();
      }
    } catch (error) {
      console.error('Error creating pocket:', error);
    }
  };

  const handleTransaction = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!transactionModal.pocketId) return;
    
    try {
      const response = await fetch(`/api/premium/pockets/${transactionModal.pocketId}`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          amount: parseInt(transactionData.amount),
          type: transactionModal.type,
          description: transactionData.description
        })
      });
      
      if (response.ok) {
        setTransactionData({ amount: '', description: '' });
        setTransactionModal({ show: false, pocketId: null, type: 'deposit' });
        fetchPockets();
      }
    } catch (error) {
      console.error('Error processing transaction:', error);
    }
  };

  const deletePocket = async (pocketId: number) => {
    if (!confirm('¿Estás seguro de eliminar este bolsillo?')) return;
    
    try {
      const response = await fetch(`/api/premium/pockets?id=${pocketId}`, {
        method: 'DELETE',
        headers: { 'Authorization': `Bearer ${token}` }
      });
      
      if (response.ok) {
        fetchPockets();
      }
    } catch (error) {
      console.error('Error deleting pocket:', error);
    }
  };

  const getProgress = (current: number, target: number) => {
    return Math.min((current / target) * 100, 100);
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <div className="animate-spin rounded-full h-8 w-8 border-4 border-green-500 border-t-transparent"></div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center space-x-3">
          <PiggyBank className="w-8 h-8 text-green-600" />
          <div>
            <h2 className="text-2xl font-bold text-gray-800">Bolsillos de Ahorro</h2>
            <p className="text-gray-600">Organiza tus ahorros por objetivos</p>
          </div>
        </div>
        
        <button
          onClick={() => setShowForm(true)}
          className="cursor-pointer flex items-center space-x-2 bg-green-600 text-white px-4 py-2 rounded-lg hover:bg-green-700 transition-colors"
        >
          <Plus className="w-5 h-5" />
          <span>Nuevo Bolsillo</span>
        </button>
      </div>

      {/* Create Pocket Form */}
      {showForm && (
        <div className="bg-white rounded-xl shadow-lg p-6">
          <h3 className="text-lg font-semibold text-gray-800 mb-4">Crear Bolsillo</h3>
          
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Nombre del Bolsillo
                </label>
                <input
                  type="text"
                  value={formData.name}
                  onChange={(e) => setFormData({...formData, name: e.target.value})}
                  className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent"
                  placeholder="Ej: Vacaciones, Casa nueva, etc."
                  required
                />
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Meta de Ahorro
                </label>
                <input
                  type="number"
                  value={formData.targetAmount}
                  onChange={(e) => setFormData({...formData, targetAmount: e.target.value})}
                  className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent"
                  placeholder="0"
                  required
                />
              </div>
            </div>
            
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Descripción (opcional)
              </label>
              <textarea
                value={formData.description}
                onChange={(e) => setFormData({...formData, description: e.target.value})}
                className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent"
                rows={3}
                placeholder="Describe tu objetivo de ahorro..."
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
                        formData.icon === icon ? 'border-green-500 bg-green-50' : 'border-gray-200'
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
                className="cursor-pointer bg-green-600 text-white px-6 py-2 rounded-lg hover:bg-green-700 transition-colors"
              >
                Crear Bolsillo
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

      {/* Transaction Modal */}
      {transactionModal.show && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-xl shadow-xl p-6 w-full max-w-md mx-4">
            <h3 className="text-lg font-semibold text-gray-800 mb-4">
              {transactionModal.type === 'deposit' ? 'Depositar en Bolsillo' : 'Retirar del Bolsillo'}
            </h3>
            
            <form onSubmit={handleTransaction} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Monto
                </label>
                <input
                  type="number"
                  value={transactionData.amount}
                  onChange={(e) => setTransactionData({...transactionData, amount: e.target.value})}
                  className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent"
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
                  value={transactionData.description}
                  onChange={(e) => setTransactionData({...transactionData, description: e.target.value})}
                  className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent"
                  placeholder="Motivo del movimiento..."
                />
              </div>
              
              <div className="flex items-center space-x-4">
                <button
                  type="submit"
                  className="cursor-pointer bg-green-600 text-white px-6 py-2 rounded-lg hover:bg-green-700 transition-colors"
                >
                  {transactionModal.type === 'deposit' ? 'Depositar' : 'Retirar'}
                </button>
                <button
                  type="button"
                  onClick={() => setTransactionModal({ show: false, pocketId: null, type: 'deposit' })}
                  className="cursor-pointer text-gray-600 hover:text-gray-800 transition-colors"
                >
                  Cancelar
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Pockets List */}
      {pockets.length === 0 ? (
        <div className="bg-white rounded-xl shadow-lg p-12 text-center">
          <PiggyBank className="w-16 h-16 text-gray-300 mx-auto mb-4" />
          <h3 className="text-xl font-semibold text-gray-800 mb-2">
            No tienes bolsillos aún
          </h3>
          <p className="text-gray-600 mb-6">
            Crea tu primer bolsillo para organizar tus ahorros por objetivos
          </p>
          <button
            onClick={() => setShowForm(true)}
            className="cursor-pointer bg-green-600 text-white px-6 py-3 rounded-lg hover:bg-green-700 transition-colors"
          >
            Crear Mi Primer Bolsillo
          </button>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {pockets.map((pocket) => {
            const progress = getProgress(pocket.current_amount, pocket.target_amount);
            
            return (
              <div 
                key={pocket.id} 
                className="bg-white rounded-xl shadow-lg overflow-hidden"
                style={{ borderTop: `4px solid ${pocket.color}` }}
              >
                <div className="p-6">
                  <div className="flex items-center justify-between mb-4">
                    <div className="flex items-center space-x-3">
                      <span className="text-2xl">{pocket.icon}</span>
                      <div>
                        <h3 className="text-lg font-semibold text-gray-800">
                          {pocket.name}
                        </h3>
                        {pocket.description && (
                          <p className="text-sm text-gray-600">{pocket.description}</p>
                        )}
                      </div>
                    </div>
                    <button
                      onClick={() => deletePocket(pocket.id)}
                      className="cursor-pointer text-gray-400 hover:text-red-500 transition-colors"
                    >
                      <Trash2 className="w-5 h-5" />
                    </button>
                  </div>
                  
                  <div className="space-y-3 mb-4">
                    <div className="flex items-center justify-between">
                      <span className="text-sm text-gray-600">Ahorrado:</span>
                      <span className="font-medium" style={{ color: pocket.color }}>
                        {formatCurrency(pocket.current_amount)}
                      </span>
                    </div>
                    
                    <div className="flex items-center justify-between">
                      <span className="text-sm text-gray-600">Meta:</span>
                      <span className="font-medium">{formatCurrency(pocket.target_amount)}</span>
                    </div>
                    
                    <div className="flex items-center justify-between">
                      <span className="text-sm text-gray-600">Falta:</span>
                      <span className="font-medium text-gray-800">
                        {formatCurrency(Math.max(0, pocket.target_amount - pocket.current_amount))}
                      </span>
                    </div>
                    
                    {/* Progress Bar */}
                    <div className="space-y-2">
                      <div className="flex items-center justify-between">
                        <span className="text-sm text-gray-600">Progreso:</span>
                        <span className="font-medium" style={{ color: pocket.color }}>
                          {Math.round(progress)}%
                        </span>
                      </div>
                      <div className="w-full bg-gray-200 rounded-full h-3">
                        <div
                          className="h-3 rounded-full transition-all"
                          style={{ 
                            backgroundColor: pocket.color,
                            width: `${progress}%` 
                          }}
                        ></div>
                      </div>
                    </div>
                  </div>
                  
                  {/* Action Buttons */}
                  <div className="flex items-center space-x-2">
                    <button
                      onClick={() => setTransactionModal({ 
                        show: true, 
                        pocketId: pocket.id, 
                        type: 'deposit' 
                      })}
                      className="cursor-pointer flex-1 flex items-center justify-center space-x-2 bg-green-50 text-green-600 py-2 rounded-lg hover:bg-green-100 transition-colors"
                    >
                      <Plus className="w-4 h-4" />
                      <span className="text-sm font-medium">Depositar</span>
                    </button>
                    
                    {pocket.current_amount > 0 && (
                      <button
                        onClick={() => setTransactionModal({ 
                          show: true, 
                          pocketId: pocket.id, 
                          type: 'withdraw' 
                        })}
                        className="cursor-pointer flex-1 flex items-center justify-center space-x-2 bg-red-50 text-red-600 py-2 rounded-lg hover:bg-red-100 transition-colors"
                      >
                        <Minus className="w-4 h-4" />
                        <span className="text-sm font-medium">Retirar</span>
                      </button>
                    )}
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
