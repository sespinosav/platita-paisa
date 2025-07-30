import { NextRequest, NextResponse } from 'next/server';
import { verifyToken } from '@/lib/auth';
import { supabase } from '@/lib/supabase';

export async function PATCH(req: NextRequest, { params }: { params: { id: string } }) {
  const token = req.headers.get('authorization')?.replace('Bearer ', '');
  if (!token) {
    return NextResponse.json({ error: 'Token requerido' }, { status: 401 });
  }
  const user = await verifyToken(token);
  if (!user) {
    return NextResponse.json({ error: 'Token inválido' }, { status: 401 });
  }
  const accountId = Number(params.id);
  if (!accountId) {
    return NextResponse.json({ error: 'ID inválido' }, { status: 400 });
  }
  // Verifica que el usuario sea el creador del parche
  const { data: account, error: accountError } = await supabase
    .from('shared_accounts')
    .select('creator_id, is_closed')
    .eq('id', accountId)
    .single();
  if (accountError || !account) {
    return NextResponse.json({ error: 'Parche no encontrado' }, { status: 404 });
  }
  if (account.is_closed) {
    return NextResponse.json({ error: 'El parche ya está cerrado' }, { status: 400 });
  }
  if (account.creator_id !== user.userId) {
    return NextResponse.json({ error: 'Solo el creador puede cerrar el parche' }, { status: 403 });
  }
  // Actualiza el estado a cerrado y registra la fecha
  const { error: updateError } = await supabase
    .from('shared_accounts')
    .update({ is_closed: true, closed_at: new Date().toISOString() })
    .eq('id', accountId);
  if (updateError) {
    return NextResponse.json({ error: 'No se pudo cerrar el parche' }, { status: 500 });
  }
  return NextResponse.json({ success: true });
}
