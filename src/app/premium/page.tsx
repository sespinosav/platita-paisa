'use client';
import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { 
  Crown, 
  TrendingUp, 
  Target, 
  PiggyBank, 
  BarChart3, 
  Calendar,
  Plus,
  ArrowLeft,
  Star,
  Sparkles,
  DollarSign,
  Award
} from 'lucide-react';
import { formatCurrency } from '@/lib/utils';
import PremiumBudgets from '@/components/premium/PremiumBudgets';
import PremiumPockets from '@/components/premium/PremiumPockets';
import PremiumGoals from '@/components/premium/PremiumGoals';
import PremiumStatistics from '@/components/premium/PremiumStatistics';

type PremiumSection = 'overview' | 'budgets' | 'pockets' | 'goals' | 'statistics';

export default function PremiumPage() {
  const router = useRouter();
  const [token, setToken] = useState<string | null>(null);
  const [user, setUser] = useState<any>(null);
  const [activeSection, setActiveSection] = useState<PremiumSection>('overview');
  const [isPremium, setIsPremium] = useState(false);
  const [loading, setLoading] = useState(true);
  const [premiumExpires, setPremiumExpires] = useState<string | null>(null);

  useEffect(() => {
    // Verificar autenticación
    const savedToken = localStorage.getItem('platita-token');
    const savedUser = localStorage.getItem('platita-user');
    
    if (!savedToken || !savedUser) {
      router.push('/');
      return;
    }
    
    setToken(savedToken);
    setUser(JSON.parse(savedUser));
    checkPremiumStatus(savedToken);
  }, [router]);

  const checkPremiumStatus = async (authToken: string) => {
    try {
      const response = await fetch('/api/premium', {
        headers: { 'Authorization': `Bearer ${authToken}` }
      });
      
      if (response.ok) {
        const data = await response.json();
        setIsPremium(data.isPremium);
        setPremiumExpires(data.expiresAt);
      }
    } catch (error) {
      console.error('Error checking premium status:', error);
    } finally {
      setLoading(false);
    }
  };

  const activatePremium = async () => {
    if (!token) return;
    
    try {
      const response = await fetch('/api/premium', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ action: 'activate', duration: 30 })
      });
      
      if (response.ok) {
        await checkPremiumStatus(token);
      }
    } catch (error) {
      console.error('Error activating premium:', error);
    }
  };

  const menuItems = [
    { id: 'overview' as PremiumSection, label: 'Resumen', icon: Crown, description: 'Vista general premium' },
    { id: 'budgets' as PremiumSection, label: 'Presupuestos', icon: Calendar, description: 'Control de gastos avanzado' },
    { id: 'pockets' as PremiumSection, label: 'Bolsillos', icon: PiggyBank, description: 'Ahorros organizados' },
    { id: 'goals' as PremiumSection, label: 'Objetivos', icon: Target, description: 'Metas financieras' },
    { id: 'statistics' as PremiumSection, label: 'Estadísticas', icon: BarChart3, description: 'Análisis profundo' }
  ];

  if (loading || !token || !user) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-purple-50 to-indigo-100 flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-4 border-purple-500 border-t-transparent"></div>
      </div>
    );
  }

  if (!isPremium) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-purple-50 to-indigo-100">
        <div className="max-w-4xl mx-auto px-4 py-8">
          {/* Header */}
          <div className="flex items-center justify-between mb-8">
            <button
              onClick={() => router.push('/')}
              className="cursor-pointer flex items-center space-x-2 text-purple-600 hover:text-purple-800 transition-colors"
            >
              <ArrowLeft className="w-5 h-5" />
              <span>Volver al Dashboard</span>
            </button>
          </div>

          {/* Premium Upgrade Card */}
          <div className="bg-gradient-to-r from-purple-600 to-indigo-600 rounded-2xl shadow-2xl overflow-hidden">
            <div className="p-8 text-white">
              <div className="flex items-center justify-center mb-6">
                <div className="bg-yellow-400 rounded-full p-4">
                  <Crown className="w-12 h-12 text-purple-600" />
                </div>
              </div>
              
              <div className="text-center">
                <h1 className="text-4xl font-bold mb-4">
                  ¡Vuélvete Premium, Parce! 👑
                </h1>
                <p className="text-xl text-purple-100 mb-8">
                  Desbloquea herramientas avanzadas para manejar tu platica como todo un paisa profesional
                </p>
              </div>

              {/* Features Grid */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">
                <div className="bg-white/10 rounded-xl p-6 backdrop-blur-sm">
                  <Calendar className="w-8 h-8 text-yellow-400 mb-4" />
                  <h3 className="text-xl font-semibold mb-2">Presupuestos Inteligentes</h3>
                  <p className="text-purple-100">
                    Crea presupuestos por categoría y período. Ve tu progreso en tiempo real y recibe alertas.
                  </p>
                </div>

                <div className="bg-white/10 rounded-xl p-6 backdrop-blur-sm">
                  <PiggyBank className="w-8 h-8 text-yellow-400 mb-4" />
                  <h3 className="text-xl font-semibold mb-2">Bolsillos de Ahorro</h3>
                  <p className="text-purple-100">
                    Organiza tus ahorros en bolsillos virtuales para diferentes propósitos.
                  </p>
                </div>

                <div className="bg-white/10 rounded-xl p-6 backdrop-blur-sm">
                  <Target className="w-8 h-8 text-yellow-400 mb-4" />
                  <h3 className="text-xl font-semibold mb-2">Objetivos Financieros</h3>
                  <p className="text-purple-100">
                    Define metas y rastrea tu progreso. ¡Hace que ahorrar sea más fácil y divertido!
                  </p>
                </div>

                <div className="bg-white/10 rounded-xl p-6 backdrop-blur-sm">
                  <BarChart3 className="w-8 h-8 text-yellow-400 mb-4" />
                  <h3 className="text-xl font-semibold mb-2">Estadísticas Avanzadas</h3>
                  <p className="text-purple-100">
                    Análisis profundo de tus finanzas con proyecciones y tendencias detalladas.
                  </p>
                </div>
              </div>

              {/* Pricing */}
              <div className="text-center">
                <div className="bg-white/20 rounded-xl p-6 mb-6 inline-block">
                  <div className="flex items-center justify-center space-x-2 mb-2">
                    <Sparkles className="w-6 h-6 text-yellow-400" />
                    <span className="text-2xl font-bold">GRATIS por 30 días</span>
                    <Sparkles className="w-6 h-6 text-yellow-400" />
                  </div>
                  <p className="text-purple-100">
                    ¡Prueba todas las funciones premium sin costo!
                  </p>
                </div>

                <button
                  onClick={activatePremium}
                  className="cursor-pointer bg-yellow-400 text-purple-900 px-8 py-4 rounded-xl font-bold text-xl hover:bg-yellow-300 transition-all transform hover:scale-105 shadow-lg"
                >
                  ¡Activar Premium Ahora! 🚀
                </button>
              </div>
            </div>
          </div>

          {/* Benefits Summary */}
          <div className="mt-12 bg-white rounded-2xl shadow-lg p-8">
            <h2 className="text-2xl font-bold text-gray-800 mb-6 text-center">
              ¿Por qué elegir Premium?
            </h2>
            
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              <div className="text-center">
                <div className="bg-green-100 rounded-full p-4 w-16 h-16 mx-auto mb-4">
                  <Award className="w-8 h-8 text-green-600" />
                </div>
                <h3 className="font-semibold text-gray-800 mb-2">Control Total</h3>
                <p className="text-gray-600">
                  Maneja tu dinero con precisión profesional
                </p>
              </div>

              <div className="text-center">
                <div className="bg-blue-100 rounded-full p-4 w-16 h-16 mx-auto mb-4">
                  <TrendingUp className="w-8 h-8 text-blue-600" />
                </div>
                <h3 className="font-semibold text-gray-800 mb-2">Crecimiento</h3>
                <p className="text-gray-600">
                  Herramientas que te ayudan a ahorrar más
                </p>
              </div>

              <div className="text-center">
                <div className="bg-purple-100 rounded-full p-4 w-16 h-16 mx-auto mb-4">
                  <Star className="w-8 h-8 text-purple-600" />
                </div>
                <h3 className="font-semibold text-gray-800 mb-2">Experiencia Premium</h3>
                <p className="text-gray-600">
                  Interface más bella y funciones exclusivas
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-purple-50 to-indigo-100">
      {/* Header */}
      <header className="bg-white shadow-sm border-b">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center py-4">
            <div className="flex items-center space-x-4">
              <button
                onClick={() => router.push('/')}
                className="cursor-pointer flex items-center space-x-2 text-purple-600 hover:text-purple-800 transition-colors"
              >
                <ArrowLeft className="w-5 h-5" />
                <span>Dashboard</span>
              </button>
              
              <div className="flex items-center space-x-3">
                <div className="bg-gradient-to-r from-yellow-400 to-orange-400 rounded-full p-2">
                  <Crown className="w-6 h-6 text-white" />
                </div>
                <div>
                  <h1 className="text-2xl font-bold text-gray-900">Premium Dashboard</h1>
                  <p className="text-sm text-gray-600">¡Hola, {user?.username}! 👑</p>
                </div>
              </div>
            </div>
            
            {premiumExpires && (
              <div className="text-right">
                <p className="text-sm font-medium text-purple-600">Premium activo</p>
                <p className="text-xs text-gray-500">
                  Hasta: {new Date(premiumExpires).toLocaleDateString('es-CO')}
                </p>
              </div>
            )}
          </div>
        </div>
      </header>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Navigation */}
        <div className="mb-8">
          <div className="bg-white rounded-xl shadow-lg p-6">
            <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
              {menuItems.map((item) => {
                const Icon = item.icon;
                const isActive = activeSection === item.id;
                
                return (
                  <button
                    key={item.id}
                    onClick={() => setActiveSection(item.id)}
                    className={`
                      cursor-pointer relative flex flex-col items-center p-4 rounded-xl transition-all duration-200
                      ${isActive
                        ? 'bg-gradient-to-r from-purple-500 to-indigo-600 text-white shadow-lg transform scale-105'
                        : 'bg-gray-50 text-gray-700 hover:bg-gray-100 hover:shadow-md'
                      }
                    `}
                  >
                    <Icon className={`w-6 h-6 mb-2 ${isActive ? 'text-white' : 'text-purple-600'}`} />
                    <span className="font-semibold text-sm">{item.label}</span>
                    <span className={`text-xs mt-1 ${isActive ? 'text-purple-100' : 'text-gray-500'}`}>
                      {item.description}
                    </span>
                    {isActive && (
                      <div className="absolute -top-1 -right-1 w-3 h-3 bg-yellow-400 rounded-full animate-pulse"></div>
                    )}
                  </button>
                );
              })}
            </div>
          </div>
        </div>

        {/* Content */}
        <div className="space-y-8">
          {activeSection === 'overview' && (
            <PremiumOverview token={token} />
          )}
          
          {activeSection === 'budgets' && (
            <PremiumBudgets token={token} />
          )}
          
          {activeSection === 'pockets' && (
            <PremiumPockets token={token} />
          )}
          
          {activeSection === 'goals' && (
            <PremiumGoals token={token} />
          )}
          
          {activeSection === 'statistics' && (
            <PremiumStatistics token={token} />
          )}
        </div>
      </div>
    </div>
  );
}

function PremiumOverview({ token }: { token: string }) {
  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
      {/* Welcome Card */}
      <div className="lg:col-span-3 bg-gradient-to-r from-purple-600 to-indigo-600 rounded-xl shadow-lg p-8 text-white">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-3xl font-bold mb-2">¡Bienvenido a Premium! 👑</h2>
            <p className="text-purple-100 text-lg">
              Ahora tienes acceso a herramientas avanzadas para manejar tu platica como todo un paisa profesional.
            </p>
          </div>
          <div className="hidden md:block">
            <div className="bg-white/20 rounded-full p-6">
              <Crown className="w-16 h-16 text-yellow-400" />
            </div>
          </div>
        </div>
      </div>

      {/* Quick Stats */}
      <div className="bg-white rounded-xl shadow-lg p-6">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-lg font-semibold text-gray-800">Presupuestos Activos</h3>
          <Calendar className="w-6 h-6 text-purple-600" />
        </div>
        <p className="text-3xl font-bold text-purple-600">-</p>
        <p className="text-sm text-gray-500">En seguimiento</p>
      </div>

      <div className="bg-white rounded-xl shadow-lg p-6">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-lg font-semibold text-gray-800">Bolsillos</h3>
          <PiggyBank className="w-6 h-6 text-green-600" />
        </div>
        <p className="text-3xl font-bold text-green-600">-</p>
        <p className="text-sm text-gray-500">Ahorrando</p>
      </div>

      <div className="bg-white rounded-xl shadow-lg p-6">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-lg font-semibold text-gray-800">Objetivos</h3>
          <Target className="w-6 h-6 text-blue-600" />
        </div>
        <p className="text-3xl font-bold text-blue-600">-</p>
        <p className="text-sm text-gray-500">En progreso</p>
      </div>

      {/* Quick Actions */}
      <div className="lg:col-span-3 bg-white rounded-xl shadow-lg p-6">
        <h3 className="text-lg font-semibold text-gray-800 mb-6">Acciones Rápidas</h3>
        
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <button className="cursor-pointer flex flex-col items-center p-4 bg-purple-50 rounded-lg hover:bg-purple-100 transition-colors">
            <Plus className="w-8 h-8 text-purple-600 mb-2" />
            <span className="text-sm font-medium text-purple-600">Nuevo Presupuesto</span>
          </button>
          
          <button className="cursor-pointer flex flex-col items-center p-4 bg-green-50 rounded-lg hover:bg-green-100 transition-colors">
            <PiggyBank className="w-8 h-8 text-green-600 mb-2" />
            <span className="text-sm font-medium text-green-600">Crear Bolsillo</span>
          </button>
          
          <button className="cursor-pointer flex flex-col items-center p-4 bg-blue-50 rounded-lg hover:bg-blue-100 transition-colors">
            <Target className="w-8 h-8 text-blue-600 mb-2" />
            <span className="text-sm font-medium text-blue-600">Nuevo Objetivo</span>
          </button>
          
          <button className="cursor-pointer flex flex-col items-center p-4 bg-orange-50 rounded-lg hover:bg-orange-100 transition-colors">
            <BarChart3 className="w-8 h-8 text-orange-600 mb-2" />
            <span className="text-sm font-medium text-orange-600">Ver Estadísticas</span>
          </button>
        </div>
      </div>
    </div>
  );
}
