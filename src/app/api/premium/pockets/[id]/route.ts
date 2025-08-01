import { NextRequest, NextResponse } from 'next/server';
import { supabase } from '@/lib/supabase';
import { verifyToken } from '@/lib/auth';

interface PocketTransaction {
  amount: number;
  type: 'deposit' | 'withdraw';
  description?: string;
}

export async function POST(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  const token = request.headers.get('authorization')?.replace('Bearer ', '');
  
  if (!token) {
    return NextResponse.json({ error: 'Token requerido' }, { status: 401 });
  }

  try {
    const userId = verifyToken(token);
    const { amount, type, description } = await request.json() as PocketTransaction;
    const pocketId = params.id;
    
    if (!amount || !type || !['deposit', 'withdraw'].includes(type)) {
      return NextResponse.json({ error: 'Datos inválidos' }, { status: 400 });
    }
    
    // Verificar que el bolsillo pertenece al usuario
    const { data: pocket, error: pocketError } = await supabase
      .from('pockets')
      .select('current_amount, target_amount')
      .eq('id', pocketId)
      .eq('user_id', userId)
      .eq('is_active', true)
      .single();
      
    if (pocketError || !pocket) {
      return NextResponse.json({ error: 'Bolsillo no encontrado' }, { status: 404 });
    }
    
    // Validar la transacción
    const newAmount = type === 'deposit' 
      ? pocket.current_amount + amount 
      : pocket.current_amount - amount;
      
    if (newAmount < 0) {
      return NextResponse.json({ error: 'No puedes retirar más de lo que tienes' }, { status: 400 });
    }
    
    // Crear la transacción del bolsillo
    const { error: transError } = await supabase
      .from('pocket_transactions')
      .insert([{
        pocket_id: pocketId,
        amount,
        type,
        description
      }]);
      
    if (transError) {
      return NextResponse.json({ error: 'Error creando transacción' }, { status: 500 });
    }
    
    // Actualizar el monto actual del bolsillo
    const { error: updateError } = await supabase
      .from('pockets')
      .update({ current_amount: newAmount })
      .eq('id', pocketId);
      
    if (updateError) {
      return NextResponse.json({ error: 'Error actualizando bolsillo' }, { status: 500 });
    }

    return NextResponse.json({ 
      success: true, 
      newAmount,
      progress: Math.round((newAmount / pocket.target_amount) * 100)
    });
    
  } catch (error) {
    return NextResponse.json({ error: 'Token inválido' }, { status: 401 });
  }
}
