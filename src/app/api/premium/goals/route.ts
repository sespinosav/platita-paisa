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
    
    const { data: goals, error } = await supabase
      .from('financial_goals')
      .select('*')
      .eq('user_id', userId)
      .order('created_at', { ascending: false });
      
    if (error) {
      return NextResponse.json({ error: 'Error obteniendo objetivos' }, { status: 500 });
    }

    // Calcular progreso de cada objetivo
    const goalsWithProgress = goals.map(goal => {
      const progress = Math.min((goal.current_amount / goal.target_amount) * 100, 100);
      const daysLeft = Math.ceil((new Date(goal.target_date).getTime() - new Date().getTime()) / (1000 * 60 * 60 * 24));
      
      return {
        ...goal,
        progress: Math.round(progress),
        daysLeft: Math.max(0, daysLeft)
      };
    });

    return NextResponse.json({ goals: goalsWithProgress });
    
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
    const { title, description, targetAmount, targetDate, category, icon, color } = await request.json();
    
    if (!title || !targetAmount || !targetDate || !category) {
      return NextResponse.json({ error: 'Campos requeridos faltantes' }, { status: 400 });
    }
    
    const { data: goal, error } = await supabase
      .from('financial_goals')
      .insert([{
        user_id: userId,
        title,
        description,
        target_amount: targetAmount,
        target_date: targetDate,
        category,
        icon: icon || '🎯',
        color: color || '#10B981'
      }])
      .select()
      .single();
      
    if (error) {
      return NextResponse.json({ error: 'Error creando objetivo' }, { status: 500 });
    }

    return NextResponse.json({ goal });
    
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
    const goalId = searchParams.get('id');
    
    if (!goalId) {
      return NextResponse.json({ error: 'ID del objetivo requerido' }, { status: 400 });
    }
    
    const { error } = await supabase
      .from('financial_goals')
      .delete()
      .eq('id', goalId)
      .eq('user_id', userId);
      
    if (error) {
      return NextResponse.json({ error: 'Error eliminando objetivo' }, { status: 500 });
    }

    return NextResponse.json({ success: true });
    
  } catch (error) {
    return NextResponse.json({ error: 'Token inválido' }, { status: 401 });
  }
}
