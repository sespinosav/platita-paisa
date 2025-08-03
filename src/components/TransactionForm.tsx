'use client';

import { useState, useEffect } from 'react';
import { Plus, DollarSign } from 'lucide-react';
import { formatCurrency } from '@/lib/utils';

interface TransactionFormProps {
  token: string;
  onTransactionAdded: () => void;
  onDatabaseError?: () => void; // Nueva prop para manejar errores de base de datos
}

export default function TransactionForm({ token, onTransactionAdded, onDatabaseError }: TransactionFormProps) {
  const [type, setType] = useState<'ingreso' | 'gasto'>('ingreso');
  const [amount, setAmount] = useState('');
  const [category, setCategory] = useState('');
  const [description, setDescription] = useState('');
  const [categories, setCategories] = useState<string[]>([]);
  const [loading, setLoading] = useState(false);
  const [showNewCategory, setShowNewCategory] = useState(false);

  useEffect(() => {
    fetchCategories();
  }, []);

  const fetchCategories = async () => {
    try {
      const response = await fetch('/api/categories', {
        headers: {
          'Authorization': `Bearer ${token}`,
        },
      });

      if (response.status === 401 || response.status === 500) {
        if (onDatabaseError) {
          onDatabaseError();
          return;
        }
      }

      const data = await response.json();
      setCategories(data.categories || []);
    } catch (error) {
      console.error('Error fetching categories:', error);
      if (onDatabaseError) {
        onDatabaseError();
      }
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      const response = await fetch('/api/transactions', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`,
        },
        body: JSON.stringify({
          type,
          amount: parseInt(amount.replace(/[^\d]/g, '')) || 0,
          category,
          description: description || undefined,
        }),
      });

      if (response.status === 401 || response.status === 500) {
        if (onDatabaseError) {
          onDatabaseError();
          return;
        }
      }

      const data = await response.json();

      if (data.success) {
        setAmount('');
        setCategory('');
        setDescription('');
        fetchCategories(); // Refrescar categorías por si se agregó una nueva
        // Refrescar balance y transacciones
        if (typeof onTransactionAdded === 'function') {
          onTransactionAdded();
        }
      }
    } catch (error) {
      console.error('Error adding transaction:', error);
      if (onDatabaseError) {
        onDatabaseError();
      }
    } finally {
      setLoading(false);
    }
  };

  const handleAmountChange = (value: string) => {
    // Solo permitir números
    const numericValue = value.replace(/[^\d]/g, '');
    setAmount(numericValue);
  };

  const amountValue = parseInt(amount.replace(/[^\d]/g, '')) || 0;

  return (
    <div className="bg-white rounded-xl shadow-lg p-6">
      <h2 className="text-2xl font-bold text-gray-800 mb-6 flex items-center">
        <Plus className="w-6 h-6 mr-2 text-green-600" />
        Agregar Movimiento
      </h2>

      <form onSubmit={handleSubmit} className="space-y-6">
        {/* Tipo de transacción */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">Tipo</label>
          <div className="flex space-x-4">
            <button
              type="button"
              onClick={() => setType('ingreso')}
              className={`flex-1 py-3 px-4 rounded-lg font-medium transition-all ${
                type === 'ingreso'
                  ? 'bg-green-500 text-white shadow-lg'
                  : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
              }`}
            >
              💰 Ingreso
            </button>
            <button
              type="button"
              onClick={() => setType('gasto')}
              className={`flex-1 py-3 px-4 rounded-lg font-medium transition-all ${
                type === 'gasto'
                  ? 'bg-red-500 text-white shadow-lg'
                  : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
              }`}
            >
              💸 Gasto
            </button>
          </div>
        </div>

        {/* Monto */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">Monto</label>
          <div className="relative">
            <DollarSign className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
            <input
              type="text"
              placeholder="0"
              value={amount}
              onChange={(e) => handleAmountChange(e.target.value)}
              className="w-full pl-10 pr-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent text-lg text-gray-800 placeholder-gray-500"
              required
            />
          </div>
          {amountValue > 0 && (
            <p className="text-sm text-gray-600 mt-1">
              {formatCurrency(amountValue)}
            </p>
          )}
        </div>

        {/* Categoría */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">Categoría</label>
          <div className="space-y-2">
            <select
              value={category}
              onChange={(e) => {
                if (e.target.value === 'nueva') {
                  setShowNewCategory(true);
                  setCategory('');
                } else {
                  setShowNewCategory(false);
                  setCategory(e.target.value);
                }
              }}
              className="w-full py-3 px-4 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent text-gray-800"
              required={!showNewCategory}
            >
              <option value="">Seleccionar categoría</option>
              {categories.map((cat) => (
                <option key={cat} value={cat}>
                  {cat}
                </option>
              ))}
              <option value="nueva">+ Crear nueva categoría</option>
            </select>

            {showNewCategory && (
              <input
                type="text"
                placeholder="Nueva categoría"
                value={category}
                onChange={(e) => setCategory(e.target.value)}
                className="w-full py-3 px-4 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent text-gray-800 placeholder-gray-500"
                required
              />
            )}
          </div>
        </div>

        {/* Descripción */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Descripción (opcional)
          </label>
          <input
          type="text"
          placeholder="¿Para qué fue este movimiento?"
          value={description}
          onChange={(e) => setDescription(e.target.value)}
          className="w-full py-3 px-4 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent text-gray-800 placeholder-gray-500"
        />
        </div>

        <button
          type="submit"
          disabled={loading}
          className="cursor-pointer w-full bg-gradient-to-r from-blue-500 to-purple-600 text-white py-3 rounded-lg font-semibold flex items-center justify-center space-x-2 hover:from-blue-600 hover:to-purple-700 transition-all duration-200 disabled:opacity-50"
        >
          {loading ? (
            <div className="animate-spin rounded-full h-5 w-5 border-2 border-white border-t-transparent"></div>
          ) : (
            <>
              <Plus className="w-5 h-5" />
              <span>Agregar {type}</span>
            </>
          )}
        </button>
      </form>
    </div>
  );
}