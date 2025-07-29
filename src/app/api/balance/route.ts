import { NextRequest, NextResponse } from 'next/server';
import { supabase } from '@/lib/supabase';
import { verifyToken } from '@/lib/auth';

function getColombianDate(): Date {
  const now = new Date();
  // Restar 5 horas en milisegundos
  const colombianTime = new Date(now.getTime() - 5 * 60 * 60 * 1000);
  return colombianTime;
}

function getDateRangeUTC(period: string) {
  // Usar tiempo colombiano para calcular rangos pero convertir a UTC para queries
  const now = getColombianDate();
  const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
  
  switch (period) {
    case 'today':
      const todayStart = new Date(today);
      const todayEnd = new Date(today);
      todayEnd.setDate(today.getDate() + 1);
      
      // Convertir a UTC RESTANDO el offset (Colombia está UTC-5)
      return {
        start: new Date(todayStart.getTime()).toISOString(),
        end: new Date(todayEnd.getTime()).toISOString()
      };
    
    case 'week':
      const weekStart = new Date(today);
      weekStart.setDate(today.getDate() - today.getDay());
      const weekEnd = new Date(weekStart);
      weekEnd.setDate(weekStart.getDate() + 7);
      
      return {
        start: new Date(weekStart.getTime()).toISOString(),
        end: new Date(weekEnd.getTime()).toISOString()
      };
    
    case 'month':
      const monthStart = new Date(now.getFullYear(), now.getMonth(), 1);
      const monthEnd = new Date(now.getFullYear(), now.getMonth() + 1, 1);
      
      return {
        start: new Date(monthStart.getTime()).toISOString(),
        end: new Date(monthEnd.getTime()).toISOString()
      };
    
    case 'year':
      const yearStart = new Date(now.getFullYear(), 0, 1);
      const yearEnd = new Date(now.getFullYear() + 1, 0, 1);
      
      return {
        start: new Date(yearStart.getTime()).toISOString(),
        end: new Date(yearEnd.getTime()).toISOString()
      };
    
    default:
      return {
        start: '2019-12-31T19:00:00.000Z', // Equivale a 2020-01-01 00:00 Colombia
        end: new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString()
      };
  }
}

export async function GET(request: NextRequest) {
  const token = request.headers.get('authorization')?.replace('Bearer ', '');
  
  if (!token) {
    return NextResponse.json({ error: 'Token requerido' }, { status: 401 });
  }
  
  const payload = verifyToken(token);
  if (!payload) {
    return NextResponse.json({ error: 'Token inválido' }, { status: 401 });
  }
  
  // Obtener el período del query parameter
  const { searchParams } = new URL(request.url);
  const period = searchParams.get('period') || 'today';
  const { start, end } = getDateRangeUTC(period);
  
  try {
    // Calcular ingresos con filtro de fecha
    const { data: ingresosData, error: ingresosError } = await supabase
      .from('transactions')
      .select('amount')
      .eq('user_id', payload.userId)
      .eq('type', 'ingreso')
      .gte('created_at', start)
      .lt('created_at', end);
    
    if (ingresosError) {
      console.error('Error fetching ingresos:', ingresosError);
      return NextResponse.json({ error: 'Error calculando ingresos' }, { status: 500 });
    }
    
    // Calcular gastos con filtro de fecha
    const { data: gastosData, error: gastosError } = await supabase
      .from('transactions')
      .select('amount')
      .eq('user_id', payload.userId)
      .eq('type', 'gasto')
      .gte('created_at', start)
      .lt('created_at', end);
    
    if (gastosError) {
      console.error('Error fetching gastos:', gastosError);
      return NextResponse.json({ error: 'Error calculando gastos' }, { status: 500 });
    }
    
    // Obtener datos por categoría con filtro de fecha
    const { data: allTransactions, error: transError } = await supabase
      .from('transactions')
      .select('category, type, amount')
      .eq('user_id', payload.userId)
      .gte('created_at', start)
      .lt('created_at', end);
    
    let categoryDataResult = [];
    if (!transError && allTransactions) {
      // Agrupar manualmente por categoría y tipo
      const grouped = allTransactions.reduce((acc, transaction) => {
        const key = `${transaction.category}-${transaction.type}`;
        if (!acc[key]) {
          acc[key] = {
            category: transaction.category,
            type: transaction.type,
            total: 0
          };
        }
        acc[key].total += parseFloat(transaction.amount);
        return acc;
      }, {});
      
      categoryDataResult = Object.values(grouped);
    }
    
    // Calcular totales
    const totalIngresos = ingresosData?.reduce((sum, item) => sum + parseFloat(item.amount), 0) || 0;
    const totalGastos = gastosData?.reduce((sum, item) => sum + parseFloat(item.amount), 0) || 0;
    const balance = totalIngresos - totalGastos;
    
    return NextResponse.json({
      balance,
      ingresos: totalIngresos,
      gastos: totalGastos,
      categoryData: categoryDataResult,
      period: period,
      dateRange: { start, end }
    });
    
  } catch (error) {
    console.error('Balance error:', error);
    return NextResponse.json({ error: 'Error interno del servidor' }, { status: 500 });
  }
}