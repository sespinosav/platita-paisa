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
    
    const { data: pockets, error } = await supabase
      .from('pockets')
      .select('*')
      .eq('user_id', userId)
      .eq('is_active', true)
      .order('created_at', { ascending: false });
      
    if (error) {
      return NextResponse.json({ error: 'Error obteniendo bolsillos' }, { status: 500 });
    }

    return NextResponse.json({ pockets });
    
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
    const { name, description, targetAmount, color, icon } = await request.json();
    
    if (!name || !targetAmount) {
      return NextResponse.json({ error: 'Nombre y monto objetivo son requeridos' }, { status: 400 });
    }
    
    const { data: pocket, error } = await supabase
      .from('pockets')
      .insert([{
        user_id: userId,
        name,
        description,
        target_amount: targetAmount,
        color: color || '#3B82F6',
        icon: icon || '🎯'
      }])
      .select()
      .single();
      
    if (error) {
      return NextResponse.json({ error: 'Error creando bolsillo' }, { status: 500 });
    }

    return NextResponse.json({ pocket });
    
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
    const pocketId = searchParams.get('id');
    
    if (!pocketId) {
      return NextResponse.json({ error: 'ID del bolsillo requerido' }, { status: 400 });
    }
    
    const { error } = await supabase
      .from('pockets')
      .update({ is_active: false })
      .eq('id', pocketId)
      .eq('user_id', userId);
      
    if (error) {
      return NextResponse.json({ error: 'Error eliminando bolsillo' }, { status: 500 });
    }

    return NextResponse.json({ success: true });
    
  } catch (error) {
    return NextResponse.json({ error: 'Token inválido' }, { status: 401 });
  }
}
