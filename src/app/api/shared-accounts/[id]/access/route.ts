import { NextRequest, NextResponse } from 'next/server';
import { verifyToken } from '@/lib/auth';
import { supabase } from '@/lib/supabase';

export async function GET(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const awaitedParams = await params;
  const token = req.headers.get('authorization')?.replace('Bearer ', '');
  
  if (!token) {
    return NextResponse.json({ error: 'Token requerido' }, { status: 401 });
  }

  const user = await verifyToken(token);
  if (!user) {
    return NextResponse.json({ error: 'Token inválido' }, { status: 401 });
  }

  const accountId = Number(awaitedParams.id);
  if (!accountId) {
    return NextResponse.json({ error: 'ID inválido' }, { status: 400 });
  }

  try {
    // Verificar que la cuenta compartida existe
    const { data: account, error: accountError } = await supabase
      .from('shared_accounts')
      .select('id, name, creator_id')
      .eq('id', accountId)
      .single();

    if (accountError || !account) {
      return NextResponse.json({ error: 'Cuenta compartida no encontrada' }, { status: 404 });
    }

    // Verificar si el usuario es el creador o un participante
    const { data: participation, error: participationError } = await supabase
      .from('shared_account_participants')
      .select('id')
      .eq('shared_account_id', accountId)
      .eq('user_id', user.userId)
      .single();

    // El usuario tiene acceso si es el creador o es un participante
    const hasAccess = account.creator_id === user.userId || participation;

    if (!hasAccess) {
      return NextResponse.json({ error: 'No tienes acceso a esta cuenta compartida' }, { status: 403 });
    }

    return NextResponse.json({ 
      success: true,
      account: {
        id: account.id,
        name: account.name,
        is_creator: account.creator_id === user.userId
      }
    });

  } catch (error) {
    console.error('Error checking access:', error);
    return NextResponse.json({ error: 'Error interno del servidor' }, { status: 500 });
  }
}
