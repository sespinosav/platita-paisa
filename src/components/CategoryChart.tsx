'use client';

import { PieChart, Pie, Cell, ResponsiveContainer, Legend, Tooltip } from 'recharts';
import { BarChart3 } from 'lucide-react';
import { formatCurrency } from '@/lib/utils';

interface CategoryData {
  category: string;
  type: 'ingreso' | 'gasto';
  total: number;
}

interface CategoryChartProps {
  categoryData: CategoryData[];
}

const COLORS = [
  '#10b981', '#3b82f6', '#8b5cf6', '#ef4444', '#f59e0b',
  '#06b6d4', '#84cc16', '#f97316', '#ec4899', '#6366f1'
];

export default function CategoryChart({ categoryData }: CategoryChartProps) {
  // Procesar datos para gastos (más común visualizar gastos por categoría)
  const expenseData = categoryData
    .filter(item => item.type === 'gasto')
    .map((item, index) => ({
      name: item.category,
      value: item.total,
      color: COLORS[index % COLORS.length],
    }))
    .sort((a, b) => b.value - a.value);

  const incomeData = categoryData
    .filter(item => item.type === 'ingreso')
    .map((item, index) => ({
      name: item.category,
      value: item.total,
      color: COLORS[index % COLORS.length],
    }))
    .sort((a, b) => b.value - a.value);

  const CustomTooltip = ({ active, payload }: any) => {
    if (active && payload && payload.length) {
      return (
        <div className="bg-white p-3 border border-gray-200 rounded-lg shadow-lg">
          <p className="font-semibold">{payload[0].name}</p>
          <p className="text-blue-600">
            {formatCurrency(payload[0].value)}
          </p>
        </div>
      );
    }
    return null;
  };

  return (
    <div className="bg-white rounded-xl shadow-lg p-6">
      <h2 className="text-2xl font-bold text-gray-800 mb-6 flex items-center">
        <BarChart3 className="w-6 h-6 mr-2 text-purple-600" />
        Gastos por Categoría
      </h2>

      {expenseData.length === 0 ? (
        <div className="text-center py-8">
          <div className="text-gray-400 mb-2">📊</div>
          <p className="text-gray-500">No hay gastos registrados</p>
          <p className="text-sm text-gray-400">Los datos aparecerán cuando agregues gastos</p>
        </div>
      ) : (
        <div className="space-y-6">
          {/* Gráfica de gastos */}
          <div>
            <h3 className="text-lg font-semibold text-gray-700 mb-4">💸 Gastos</h3>
            <ResponsiveContainer width="100%" height={300}>
              <PieChart>
                <Pie
                  data={expenseData}
                  cx="50%"
                  cy="50%"
                  labelLine={false}
                  label={({ name, percent }) => 
                    `${name} ${(percent * 100).toFixed(0)}%`
                  }
                  outerRadius={100}
                  fill="#8884d8"
                  dataKey="value"
                >
                  {expenseData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={entry.color} />
                  ))}
                </Pie>
                <Tooltip content={<CustomTooltip />} />
              </PieChart>
            </ResponsiveContainer>
          </div>

          {/* Lista de gastos por categoría */}
          <div>
            <h4 className="font-semibold text-gray-700 mb-3">Desglose de gastos:</h4>
            <div className="space-y-2">
              {expenseData.map((item, index) => (
                <div key={item.name} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                  <div className="flex items-center space-x-3">
                    <div 
                      className="w-4 h-4 rounded-full"
                      style={{ backgroundColor: item.color }}
                    ></div>
                    <span className="font-medium text-gray-800">{item.name}</span>
                  </div>
                  <span className="font-semibold text-red-600">
                    {formatCurrency(item.value)}
                  </span>
                </div>
              ))}
            </div>
          </div>

          {/* Gráfica de ingresos si hay datos */}
          {incomeData.length > 0 && (
            <div className="border-t pt-6">
              <h3 className="text-lg font-semibold text-gray-700 mb-4">💰 Ingresos</h3>
              <div className="space-y-2">
                {incomeData.map((item, index) => (
                  <div key={item.name} className="flex items-center justify-between p-3 bg-green-50 rounded-lg">
                    <div className="flex items-center space-x-3">
                      <div 
                        className="w-4 h-4 rounded-full"
                        style={{ backgroundColor: item.color }}
                      ></div>
                      <span className="font-medium text-gray-800">{item.name}</span>
                    </div>
                    <span className="font-semibold text-green-600">
                      {formatCurrency(item.value)}
                    </span>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
}