import { NextRequest, NextResponse } from 'next/server';
import { supabase } from '@/lib/supabase';
import { verifyToken } from '@/lib/auth';

function getColombianDate() {
  // Crear fecha en zona horaria de Colombia (UTC-5)
  const now = new Date();
  const colombianTime = new Date(now.toLocaleString("en-US", {timeZone: "America/Bogota"}));
  return colombianTime;
}

function getDateRange(period: string) {
  // Usar tiempo colombiano en lugar de UTC
  const now = getColombianDate();
  const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
  
  switch (period) {
    case 'today':
      const todayStart = new Date(today);
      const todayEnd = new Date(today);
      todayEnd.setDate(today.getDate() + 1);
      
      return {
        start: todayStart.toISOString(),
        end: todayEnd.toISOString()
      };
    
    case 'week':
      const weekStart = new Date(today);
      weekStart.setDate(today.getDate() - today.getDay());
      const weekEnd = new Date(weekStart);
      weekEnd.setDate(weekStart.getDate() + 7);
      return {
        start: weekStart.toISOString(),
        end: weekEnd.toISOString()
      };
    
    case 'month':
      const monthStart = new Date(now.getFullYear(), now.getMonth(), 1);
      const monthEnd = new Date(now.getFullYear(), now.getMonth() + 1, 1);
      return {
        start: monthStart.toISOString(),
        end: monthEnd.toISOString()
      };
    
    case 'year':
      const yearStart = new Date(now.getFullYear(), 0, 1);
      const yearEnd = new Date(now.getFullYear() + 1, 0, 1);
      return {
        start: yearStart.toISOString(),
        end: yearEnd.toISOString()
      };
    
    default:
      return {
        start: '2020-01-01T00:00:00.000Z',
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
  const dateRange = getDateRange(period);
  
  try {
    let query = supabase
      .from('transactions')
      .select('*')
      .eq('user_id', payload.userId)
      .order('created_at', { ascending: false });
    
    // Aplicar filtro de fecha si existe
    if (dateRange) {
      query = query
        .gte('created_at', dateRange.start)
        .lt('created_at', dateRange.end);
    } else {
      // Si no hay filtro de fecha, limitar a las últimas 50 transacciones
      query = query.limit(50);
    }
    
    const { data: transactions, error: transactionsError } = await query;
    
    if (transactionsError) {
      console.error('Error fetching transactions:', transactionsError);
      return NextResponse.json({ error: 'Error obteniendo transacciones' }, { status: 500 });
    }
    
    return NextResponse.json({ 
      transactions: transactions || [],
      period: period,
      dateRange: dateRange,
      count: transactions?.length || 0
    });
    
  } catch (error) {
    console.error('Transactions GET error:', error);
    return NextResponse.json({ error: 'Error interno del servidor' }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  const token = request.headers.get('authorization')?.replace('Bearer ', '');
  
  if (!token) {
    return NextResponse.json({ error: 'Token requerido' }, { status: 401 });
  }
  
  const payload = verifyToken(token);
  if (!payload) {
    return NextResponse.json({ error: 'Token inválido' }, { status: 401 });
  }
  
  const { type, amount, category, description } = await request.json();
  
  if (!type || !amount || !category) {
    return NextResponse.json({ error: 'Campos requeridos faltantes' }, { status: 400 });
  }
  
  try {
    // Guardar la categoría si es nueva (usar upsert para evitar duplicados)
    const { error: categoryError } = await supabase
      .from('user_categories')
      .upsert([{
        user_id: payload.userId,
        category_name: category
      }], {
        onConflict: 'user_id,category_name',
        ignoreDuplicates: true
      });
    
    if (categoryError) {
      console.error('Error saving category:', categoryError);
      // Continuar aunque falle guardar la categoría
    }
    
    // Crear la transacción
    const { data: newTransaction, error: transactionError } = await supabase
      .from('transactions')
      .insert([{
        user_id: payload.userId,
        type,
        amount: parseFloat(amount),
        category,
        description: description || null
      }])
      .select()
      .single();
    
    if (transactionError) {
      console.error('Error creating transaction:', transactionError);
      return NextResponse.json({ error: 'Error creando transacción' }, { status: 500 });
    }
    
    return NextResponse.json({
      success: true,
      transaction: {
        id: newTransaction.id,
        type: newTransaction.type,
        amount: newTransaction.amount,
        category: newTransaction.category,
        description: newTransaction.description,
        created_at: newTransaction.created_at
      }
    });
    
  } catch (error) {
    console.error('Transaction POST error:', error);
    return NextResponse.json({ error: 'Error interno del servidor' }, { status: 500 });
  }
}

export async function DELETE(request: NextRequest) {
  const token = request.headers.get('authorization')?.replace('Bearer ', '');
  if (!token) {
    return NextResponse.json({ error: 'Token requerido' }, { status: 401 });
  }
  
  const payload = verifyToken(token);
  if (!payload) {
    return NextResponse.json({ error: 'Token inválido' }, { status: 401 });
  }
  
  const { searchParams } = new URL(request.url);
  const id = searchParams.get('id');
  
  if (!id) {
    return NextResponse.json({ error: 'ID requerido' }, { status: 400 });
  }
  
  try {
    // Verificar que la transacción pertenezca al usuario y eliminarla
    const { data: deletedTransaction, error: deleteError } = await supabase
      .from('transactions')
      .delete()
      .eq('id', id)
      .eq('user_id', payload.userId)
      .select()
      .single();
    
    if (deleteError || !deletedTransaction) {
      console.error('Error deleting transaction:', deleteError);
      return NextResponse.json({ 
        error: 'Transacción no encontrada o no autorizada' 
      }, { status: 404 });
    }
    
    return NextResponse.json({ success: true });
    
  } catch (error) {
    console.error('Transaction DELETE error:', error);
    return NextResponse.json({ error: 'Error interno del servidor' }, { status: 500 });
  }
}