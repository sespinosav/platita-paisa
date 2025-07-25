import { NextRequest, NextResponse } from 'next/server';
import { supabase } from '@/lib/supabase';
import { verifyToken } from '@/lib/auth';

export async function GET(request: NextRequest) {
  const token = request.headers.get('authorization')?.replace('Bearer ', '');
  
  if (!token) {
    return NextResponse.json({ error: 'Token requerido' }, { status: 401 });
  }
  
  const payload = verifyToken(token);
  if (!payload) {
    return NextResponse.json({ error: 'Token inválido' }, { status: 401 });
  }
  
  try {
    // Calcular ingresos
    const { data: ingresosData, error: ingresosError } = await supabase
      .from('transactions')
      .select('amount')
      .eq('user_id', payload.userId)
      .eq('type', 'ingreso');
    
    if (ingresosError) {
      console.error('Error fetching ingresos:', ingresosError);
      return NextResponse.json({ error: 'Error calculando ingresos' }, { status: 500 });
    }
    
    // Calcular gastos
    const { data: gastosData, error: gastosError } = await supabase
      .from('transactions')
      .select('amount')
      .eq('user_id', payload.userId)
      .eq('type', 'gasto');
    
    if (gastosError) {
      console.error('Error fetching gastos:', gastosError);
      return NextResponse.json({ error: 'Error calculando gastos' }, { status: 500 });
    }
    
    // Obtener datos por categoría usando RPC para GROUP BY
    const { data: categoryData, error: categoryError } = await supabase
      .rpc('get_category_totals', { user_id_param: payload.userId });
    
    // Si RPC no está disponible, usar una consulta alternativa
    let categoryDataResult = categoryData;
    if (categoryError) {
      const { data: allTransactions, error: transError } = await supabase
        .from('transactions')
        .select('category, type, amount')
        .eq('user_id', payload.userId);
      
      if (!transError) {
        // Agrupar manualmente
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
    }
    
    // Calcular totales
    const totalIngresos = ingresosData?.reduce((sum, item) => sum + parseFloat(item.amount), 0) || 0;
    const totalGastos = gastosData?.reduce((sum, item) => sum + parseFloat(item.amount), 0) || 0;
    const balance = totalIngresos - totalGastos;
    
    return NextResponse.json({
      balance,
      ingresos: totalIngresos,
      gastos: totalGastos,
      categoryData: categoryDataResult || []
    });
    
  } catch (error) {
    console.error('Balance error:', error);
    return NextResponse.json({ error: 'Error interno del servidor' }, { status: 500 });
  }
}