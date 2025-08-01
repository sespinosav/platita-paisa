import { NextRequest, NextResponse } from 'next/server';
import { supabase } from '@/lib/supabase';
import { verifyToken } from '@/lib/auth';

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
    const { amount, description } = await request.json();
    const goalId = params.id;
    
    if (!amount || amount <= 0) {
      return NextResponse.json({ error: 'Monto inválido' }, { status: 400 });
    }
    
    // Verificar que el objetivo pertenece al usuario
    const { data: goal, error: goalError } = await supabase
      .from('financial_goals')
      .select('current_amount, target_amount, is_completed')
      .eq('id', goalId)
      .eq('user_id', userId)
      .single();
      
    if (goalError || !goal) {
      return NextResponse.json({ error: 'Objetivo no encontrado' }, { status: 404 });
    }
    
    if (goal.is_completed) {
      return NextResponse.json({ error: 'Este objetivo ya está completado' }, { status: 400 });
    }
    
    // Crear la contribución
    const { error: contribError } = await supabase
      .from('goal_contributions')
      .insert([{
        goal_id: goalId,
        amount,
        description
      }]);
      
    if (contribError) {
      return NextResponse.json({ error: 'Error creando contribución' }, { status: 500 });
    }
    
    // Actualizar el monto actual del objetivo
    const newAmount = goal.current_amount + amount;
    const isCompleted = newAmount >= goal.target_amount;
    
    const updateData: any = { current_amount: newAmount };
    if (isCompleted) {
      updateData.is_completed = true;
      updateData.completed_at = new Date().toISOString();
    }
    
    const { error: updateError } = await supabase
      .from('financial_goals')
      .update(updateData)
      .eq('id', goalId);
      
    if (updateError) {
      return NextResponse.json({ error: 'Error actualizando objetivo' }, { status: 500 });
    }

    return NextResponse.json({ 
      success: true, 
      newAmount,
      isCompleted,
      progress: Math.round((newAmount / goal.target_amount) * 100)
    });
    
  } catch (error) {
    return NextResponse.json({ error: 'Token inválido' }, { status: 401 });
  }
}
