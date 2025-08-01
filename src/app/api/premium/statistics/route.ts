import { NextRequest, NextResponse } from 'next/server';
import { supabase } from '@/lib/supabase';
import { verifyToken } from '@/lib/auth';

export async function GET(request: NextRequest) {
  const token = request.headers.get('authorization')?.replace('Bearer ', '');
  
  if (!token) {
    return NextResponse.json({ error: 'Token requerido' }, { status: 401 });
  }

  try {
    const tokenData = verifyToken(token);
    if (!tokenData) {
      return NextResponse.json({ error: 'Token inválido' }, { status: 401 });
    }
    const userId = tokenData.userId;
    const { searchParams } = new URL(request.url);
    const period = searchParams.get('period') || 'month';
    
    // Calcular estadísticas avanzadas
    const stats = await calculateAdvancedStats(userId, period);
    
    return NextResponse.json({ stats });
    
  } catch (error) {
    console.error('Error getting statistics:', error);
    return NextResponse.json({ error: 'Token inválido' }, { status: 401 });
  }
}

async function calculateAdvancedStats(userId: number, period: string) {
  const now = new Date();
  let startDate: Date;
  let compareStartDate: Date;
  
  // Definir fechas según el período
  switch (period) {
    case 'week':
      startDate = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
      compareStartDate = new Date(now.getTime() - 14 * 24 * 60 * 60 * 1000);
      break;
    case 'year':
      startDate = new Date(now.getFullYear(), 0, 1);
      compareStartDate = new Date(now.getFullYear() - 1, 0, 1);
      break;
    default: // month
      startDate = new Date(now.getFullYear(), now.getMonth(), 1);
      compareStartDate = new Date(now.getFullYear(), now.getMonth() - 1, 1);
  }
  
  // Obtener transacciones del período actual
  const { data: currentTransactions } = await supabase
    .from('transactions')
    .select('type, amount, category, created_at')
    .eq('user_id', userId)
    .gte('created_at', startDate.toISOString());
    
  // Obtener transacciones del período anterior para comparación
  const { data: previousTransactions } = await supabase
    .from('transactions')
    .select('type, amount, category, created_at')
    .eq('user_id', userId)
    .gte('created_at', compareStartDate.toISOString())
    .lt('created_at', startDate.toISOString());
  
  // Calcular métricas actuales
  const currentIncome = currentTransactions?.filter(t => t.type === 'ingreso').reduce((sum, t) => sum + t.amount, 0) || 0;
  const currentExpenses = currentTransactions?.filter(t => t.type === 'gasto').reduce((sum, t) => sum + t.amount, 0) || 0;
  const currentSavings = currentIncome - currentExpenses;
  
  // Calcular métricas anteriores
  const previousIncome = previousTransactions?.filter(t => t.type === 'ingreso').reduce((sum, t) => sum + t.amount, 0) || 0;
  const previousExpenses = previousTransactions?.filter(t => t.type === 'gasto').reduce((sum, t) => sum + t.amount, 0) || 0;
  const previousSavings = previousIncome - previousExpenses;
  
  // Calcular cambios porcentuales
  const incomeChange = previousIncome > 0 ? ((currentIncome - previousIncome) / previousIncome) * 100 : 0;
  const expenseChange = previousExpenses > 0 ? ((currentExpenses - previousExpenses) / previousExpenses) * 100 : 0;
  const savingsChange = previousSavings !== 0 ? ((currentSavings - previousSavings) / Math.abs(previousSavings)) * 100 : 0;
  
  // Análisis de categorías
  const categoryAnalysis = analyzeCategoryTrends(currentTransactions || [], previousTransactions || []);
  
  // Análisis de patrones de gasto
  const spendingPatterns = analyzeSpendingPatterns(currentTransactions || []);
  
  // Proyecciones
  const projections = calculateProjections(currentTransactions || [], period);
  
  return {
    summary: {
      currentIncome,
      currentExpenses,
      currentSavings,
      incomeChange: Math.round(incomeChange * 100) / 100,
      expenseChange: Math.round(expenseChange * 100) / 100,
      savingsChange: Math.round(savingsChange * 100) / 100,
      savingsRate: currentIncome > 0 ? Math.round((currentSavings / currentIncome) * 100) : 0
    },
    categoryAnalysis,
    spendingPatterns,
    projections,
    period
  };
}

function analyzeCategoryTrends(current: any[], previous: any[]) {
  const currentByCategory = current
    .filter(t => t.type === 'gasto')
    .reduce((acc, t) => {
      acc[t.category] = (acc[t.category] || 0) + t.amount;
      return acc;
    }, {} as Record<string, number>);
    
  const previousByCategory = previous
    .filter(t => t.type === 'gasto')
    .reduce((acc, t) => {
      acc[t.category] = (acc[t.category] || 0) + t.amount;
      return acc;
    }, {} as Record<string, number>);
    
  const categories = [...new Set([...Object.keys(currentByCategory), ...Object.keys(previousByCategory)])];
  
  return categories.map(category => {
    const current = currentByCategory[category] || 0;
    const previous = previousByCategory[category] || 0;
    const change = previous > 0 ? ((current - previous) / previous) * 100 : 0;
    
    return {
      category,
      current,
      previous,
      change: Math.round(change * 100) / 100,
      trend: change > 10 ? 'increasing' : change < -10 ? 'decreasing' : 'stable'
    };
  }).sort((a, b) => b.current - a.current);
}

function analyzeSpendingPatterns(transactions: any[]) {
  const expenses = transactions.filter(t => t.type === 'gasto');
  
  if (expenses.length === 0) return null;
  
  // Análisis por día de la semana
  const byDayOfWeek = expenses.reduce((acc, t) => {
    const day = new Date(t.created_at).getDay();
    acc[day] = (acc[day] || 0) + t.amount;
    return acc;
  }, {} as Record<number, number>);
  
  const days = ['Domingo', 'Lunes', 'Martes', 'Miércoles', 'Jueves', 'Viernes', 'Sábado'];
  const dayAnalysis = days.map((day, index) => ({
    day,
    amount: byDayOfWeek[index] || 0
  }));
  
  // Gasto promedio diario
  const totalDays = Math.ceil((Date.now() - new Date(expenses[expenses.length - 1].created_at).getTime()) / (1000 * 60 * 60 * 24)) || 1;
  const avgDailySpending = expenses.reduce((sum, t) => sum + t.amount, 0) / totalDays;
  
  return {
    avgDailySpending: Math.round(avgDailySpending),
    dayOfWeekAnalysis: dayAnalysis,
    totalTransactions: expenses.length
  };
}

function calculateProjections(transactions: any[], period: string) {
  const expenses = transactions.filter(t => t.type === 'gasto');
  const income = transactions.filter(t => t.type === 'ingreso');
  
  if (expenses.length === 0 && income.length === 0) return null;
  
  const totalExpenses = expenses.reduce((sum, t) => sum + t.amount, 0);
  const totalIncome = income.reduce((sum, t) => sum + t.amount, 0);
  
  const now = new Date();
  const daysElapsed = period === 'week' ? 7 : period === 'year' ? 365 : now.getDate();
  const totalDaysInPeriod = period === 'week' ? 7 : period === 'year' ? 365 : new Date(now.getFullYear(), now.getMonth() + 1, 0).getDate();
  
  const dailyAvgExpenses = totalExpenses / daysElapsed;
  const dailyAvgIncome = totalIncome / daysElapsed;
  
  const projectedExpenses = dailyAvgExpenses * totalDaysInPeriod;
  const projectedIncome = dailyAvgIncome * totalDaysInPeriod;
  const projectedSavings = projectedIncome - projectedExpenses;
  
  return {
    projectedExpenses: Math.round(projectedExpenses),
    projectedIncome: Math.round(projectedIncome),
    projectedSavings: Math.round(projectedSavings),
    dailyAvgExpenses: Math.round(dailyAvgExpenses),
    dailyAvgIncome: Math.round(dailyAvgIncome)
  };
}
