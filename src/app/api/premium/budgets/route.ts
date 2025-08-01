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
    
    const { data: budgets, error } = await supabase
      .from('budgets')
      .select('*')
      .eq('user_id', userId)
      .eq('is_active', true)
      .order('created_at', { ascending: false });
      
    if (error) {
      return NextResponse.json({ error: 'Error obteniendo presupuestos' }, { status: 500 });
    }
    
    // Calcular progreso de cada presupuesto
    const budgetsWithProgress = await Promise.all(budgets.map(async (budget) => {
      const startDate = new Date(budget.start_date);
      const endDate = new Date(budget.end_date);
      
      const { data: transactions, error: transError } = await supabase
        .from('transactions')
        .select('amount')
        .eq('user_id', userId)
        .eq('category', budget.category)
        .eq('type', 'gasto')
        .gte('created_at', startDate.toISOString())
        .lte('created_at', endDate.toISOString());
        
      if (transError) {
        console.error('Error calculating budget progress:', transError);
        return { ...budget, spent: 0, remaining: budget.amount, progress: 0 };
      }
      
      const spent = transactions.reduce((sum, t) => sum + t.amount, 0);
      const remaining = budget.amount - spent;
      const progress = Math.min((spent / budget.amount) * 100, 100);
      
      return {
        ...budget,
        spent,
        remaining,
        progress: Math.round(progress)
      };
    }));

    return NextResponse.json({ budgets: budgetsWithProgress });
    
  } catch (error) {
    return NextResponse.json({ error: 'Token inválido' }, { status: 401 });
  }
}

export async function POST(request: NextRequest) {
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
    const { category, amount, period, startDate, endDate } = await request.json();
    
    if (!category || !amount || !period || !startDate || !endDate) {
      return NextResponse.json({ error: 'Todos los campos son requeridos' }, { status: 400 });
    }
    
    const { data: budget, error } = await supabase
      .from('budgets')
      .insert([{
        user_id: userId,
        category,
        amount,
        period,
        start_date: startDate,
        end_date: endDate
      }])
      .select()
      .single();
      
    if (error) {
        console.error('Error creating budget:', error);
      return NextResponse.json({ error: 'Error creando presupuesto' }, { status: 500 });
    }

    return NextResponse.json({ budget });
    
  } catch (error) {
    return NextResponse.json({ error: 'Token inválido' }, { status: 401 });
  }
}

export async function DELETE(request: NextRequest) {
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
    const budgetId = searchParams.get('id');
    
    if (!budgetId) {
      return NextResponse.json({ error: 'ID del presupuesto requerido' }, { status: 400 });
    }
    
    const { error } = await supabase
      .from('budgets')
      .update({ is_active: false })
      .eq('id', budgetId)
      .eq('user_id', userId);
      
    if (error) {
      return NextResponse.json({ error: 'Error eliminando presupuesto' }, { status: 500 });
    }

    return NextResponse.json({ success: true });
    
  } catch (error) {
    return NextResponse.json({ error: 'Token inválido' }, { status: 401 });
  }
}
