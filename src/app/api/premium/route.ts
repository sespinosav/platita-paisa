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
    console.log('GET - userId type:', typeof userId, 'value:', userId);
    
    const { data: user, error } = await supabase
      .from('users')
      .select('is_premium, premium_expires_at')
      .eq('id', userId)
      .single();
      
    if (error) {
      console.error('GET - Supabase error:', error);
      return NextResponse.json({ error: 'Error obteniendo información premium' }, { status: 500 });
    }

    const isPremium = user.is_premium && (!user.premium_expires_at || new Date(user.premium_expires_at) > new Date());
    
    return NextResponse.json({
      isPremium,
      expiresAt: user.premium_expires_at
    });
    
  } catch (error) {
    console.error('GET - Error:', error);
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
    console.log('POST - userId type:', typeof userId, 'value:', userId);
    const { action, duration = 30 } = await request.json(); // duration en días
    
    if (action === 'activate') {
      const expiresAt = new Date();
      expiresAt.setDate(expiresAt.getDate() + duration);
      
      const { error } = await supabase
        .from('users')
        .update({
          is_premium: true,
          premium_expires_at: expiresAt.toISOString()
        })
        .eq('id', userId);
        
      if (error) {
        console.error('Error activating premium:', error);
        return NextResponse.json({ error: 'Error activando premium' }, { status: 500 });
      }
      
      return NextResponse.json({ success: true, expiresAt });
    }
    
    return NextResponse.json({ error: 'Acción no válida' }, { status: 400 });
    
  } catch (error) {
    console.error('POST - Error:', error);
    return NextResponse.json({ error: 'Token inválido' }, { status: 401 });
  }
}
