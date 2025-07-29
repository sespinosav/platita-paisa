import { NextRequest, NextResponse } from 'next/server';
import { supabase } from '@/lib/supabase';
import { verifyToken } from '@/lib/auth';
import { toZonedTime } from 'date-fns-tz';

function getDateRangeUTC(period: string) {
  // Usar tiempo colombiano para calcular rangos pero convertir a UTC para queries
  const timeZone = 'America/Bogota';
  const now = toZonedTime(new Date(), timeZone);
  // Fecha actual en Colombia
  const year = now.getFullYear();
  const month = now.getMonth();
  const date = now.getDate();

  switch (period) {
    case 'today': {
      // Medianoche Colombia
      const startCol = new Date(year, month, date, 0, 0, 0);
      const endCol = new Date(year, month, date + 1, 0, 0, 0);
      return {
        start: startCol.toISOString(),
        end: endCol.toISOString()
      };
    }
    case 'week': {
      // Primer día de la semana Colombia (domingo)
      const dayOfWeek = now.getDay();
      const startCol = new Date(year, month, date - dayOfWeek, 0, 0, 0);
      const endCol = new Date(year, month, date - dayOfWeek + 7, 0, 0, 0);
      return {
        start: startCol.toISOString(),
        end: endCol.toISOString()
      };
    }
    case 'month': {
      const startCol = new Date(year, month, 1, 0, 0, 0);
      const endCol = new Date(year, month + 1, 1, 0, 0, 0);
      return {
        start: startCol.toISOString(),
        end: endCol.toISOString()
      };
    }
    case 'year': {
      const startCol = new Date(year, 0, 1, 0, 0, 0);
      const endCol = new Date(year + 1, 0, 1, 0, 0, 0);
      return {
        start: startCol.toISOString(),
        end: endCol.toISOString()
      };
    }
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